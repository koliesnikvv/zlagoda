import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import { CreateCheckDto } from './dto/create-check.dto';
import { JwtPayload } from '../common/decorators/current-user.decorator';

const VAT_RATE = 0.2;

@Injectable()
export class CheckService {
  constructor(private readonly dataSource: DataSource) {}

  private generateCheckNumber() {
    return randomBytes(5).toString('hex').slice(0, 10);
  }

  private round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  async create(dto: CreateCheckDto, user: JwtPayload) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    const checkNumber = this.generateCheckNumber();

    try {
      let discount = 0;
      if (dto.card_number) {
        const cardRows: { percent: number }[] = await qr.query(
          `SELECT percent FROM Customer_Card WHERE card_number = $1`,
          [dto.card_number],
        );
        if (!cardRows || cardRows.length === 0) {
          throw new NotFoundException('Картку клієнта не знайдено');
        }
        discount = Number(cardRows[0].percent) / 100;
      }

      let totalSum = 0;
      const itemsToSave: Array<{
        upc: string;
        product_number: number;
        unit_price: number;
      }> = [];

      for (const item of dto.items) {
        const spRows: any[] = await qr.query(
          `SELECT selling_price, products_number, promotional_product
           FROM Store_Product WHERE UPC = $1 FOR UPDATE`,
          [item.UPC],
        );
        if (!spRows || spRows.length === 0) {
          throw new NotFoundException(`Товар з UPC ${item.UPC} не знайдено`);
        }
        const sp = spRows[0];
        if (Number(sp.products_number) < item.product_number) {
          throw new BadRequestException(
            `Недостатньо одиниць товару ${item.UPC} на складі`,
          );
        }
        const unitPrice = Number(sp.selling_price);
        const lineTotal = this.round2(unitPrice * item.product_number);
        totalSum += lineTotal;
        itemsToSave.push({
          upc: item.UPC,
          product_number: item.product_number,
          unit_price: unitPrice,
        });
      }

      if (discount > 0) {
        totalSum = this.round2(totalSum * (1 - discount));
      } else {
        totalSum = this.round2(totalSum);
      }

      const vat = this.round2(totalSum * VAT_RATE);

      await qr.query(
        `INSERT INTO "Check" (check_number, id_employee, card_number, print_date, sum_total, vat)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          checkNumber,
          user.user_id,
          dto.card_number ?? null,
          new Date(),
          totalSum,
          vat,
        ],
      );

      for (const s of itemsToSave) {
        await qr.query(
          `INSERT INTO Sale (UPC, check_number, product_number, selling_price)
           VALUES ($1, $2, $3, $4)`,
          [s.upc, checkNumber, s.product_number, s.unit_price],
        );
        await qr.query(
          `UPDATE Store_Product SET products_number = products_number - $1 WHERE UPC = $2`,
          [s.product_number, s.upc],
        );
      }

      await qr.commitTransaction();

      return {
        message: 'Чек успішно створено',
        check_number: checkNumber,
        total: totalSum,
        vat,
      };
    } catch (e) {
      await qr.rollbackTransaction();
      if (
        e instanceof NotFoundException ||
        e instanceof BadRequestException ||
        e instanceof ForbiddenException
      ) {
        throw e;
      }
      throw new InternalServerErrorException((e as Error).message);
    } finally {
      await qr.release();
    }
  }

  async findAll(opts: {
    user: JwtPayload;
    startDate?: string;
    endDate?: string;
    idEmployee?: string;
    todayOnly?: boolean;
    sort?: string;
    order?: string;
  }) {
    let idEmployee = opts.idEmployee;
    if (opts.user.role === 'Cashier') {
      idEmployee = opts.user.user_id;
    }

    let query = `
      SELECT c.check_number,
             e.empl_surname,
             p.product_name,
             s.product_number,
             s.selling_price * s.product_number AS line_total,
             c.print_date
      FROM "Check" c
      JOIN Employee e  ON c.id_employee  = e.id_employee
      JOIN Sale s      ON s.check_number = c.check_number
      JOIN Store_Product sp ON sp.UPC    = s.UPC
      JOIN Product p   ON p.id_product   = sp.id_product
      WHERE 1=1
    `;
    const params: any[] = [];

    if (opts.todayOnly) {
      query += ' AND c.print_date::date = CURRENT_DATE';
    } else {
      if (opts.startDate) {
        params.push(opts.startDate);
        query += ` AND c.print_date >= $${params.length}`;
      }
      if (opts.endDate) {
        const d = new Date(opts.endDate);
        d.setDate(d.getDate() + 1);
        params.push(d.toISOString().slice(0, 10));
        query += ` AND c.print_date <= $${params.length}`;
      }
    }
    if (idEmployee) {
      params.push(idEmployee);
      query += ` AND c.id_employee = $${params.length}`;
    }

    const sortMap: Record<string, string> = {
      id: 'c.check_number',
      cashier: 'e.empl_surname',
      product: 'p.product_name',
      quantity: 's.product_number',
      total: 'line_total',
      date: 'c.print_date',
    };
    const col = opts.sort ? sortMap[opts.sort] : undefined;
    const dir = String(opts.order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    if (col) {
      query += ` ORDER BY ${col} ${dir}`;
    } else {
      query += ' ORDER BY c.print_date DESC';
    }

    const rows: any[] = await this.dataSource.query(query, params);
    return rows.map((r) => ({
      id: r.check_number,
      cashier: r.empl_surname,
      product: r.product_name,
      quantity: r.product_number,
      total: Number(r.line_total),
      date: String(r.print_date),
    }));
  }

  async findOne(checkNumber: string, user: JwtPayload) {
    const headRows: any[] = await this.dataSource.query(
      `SELECT c.check_number, c.id_employee, e.empl_surname, c.card_number,
              c.print_date, c.sum_total, c.vat
       FROM "Check" c
       JOIN Employee e ON c.id_employee = e.id_employee
       WHERE c.check_number = $1`,
      [checkNumber],
    );
    if (!headRows || headRows.length === 0) {
      throw new NotFoundException('Чек не знайдено');
    }
    const head = headRows[0];

    if (user.role === 'Cashier' && head.id_employee !== user.user_id) {
      throw new ForbiddenException('Чужий чек');
    }

    const itemRows: any[] = await this.dataSource.query(
      `SELECT s.UPC, p.product_name, s.product_number, s.selling_price
       FROM Sale s
       JOIN Store_Product sp ON s.UPC = sp.UPC
       JOIN Product p ON sp.id_product = p.id_product
       WHERE s.check_number = $1`,
      [checkNumber],
    );

    return {
      check_number: head.check_number,
      id_employee: head.id_employee,
      cashier_surname: head.empl_surname,
      card_number: head.card_number,
      print_date: String(head.print_date),
      sum_total: Number(head.sum_total),
      vat: Number(head.vat),
      items: itemRows.map((i) => ({
        upc: i.upc,
        product_name: i.product_name,
        product_number: i.product_number,
        selling_price: Number(i.selling_price),
      })),
    };
  }

  async remove(checkNumber: string) {
    try {
      const rows: any[] = await this.dataSource.query(
        `DELETE FROM "Check" WHERE check_number = $1 RETURNING check_number`,
        [checkNumber],
      );
      if (!rows || rows.length === 0) {
        throw new NotFoundException('Чек не знайдено');
      }
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException((e as Error).message);
    }
    return { message: 'Чек видалено' };
  }
}
