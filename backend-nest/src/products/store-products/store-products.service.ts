import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import { StoreProductDto } from './dto/store-product.dto';

@Injectable()
export class StoreProductsService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(opts: {
    promo?: boolean;
    sort?: string;
    order?: string;
    categoryNumber?: number;
  }) {
    let query = `SELECT sp.UPC, p.product_name, sp.selling_price, sp.products_number,
                        sp.promotional_product, p.id_product, p.category_number
                 FROM Store_Product sp
                 JOIN Product p ON sp.id_product = p.id_product
                 WHERE 1=1`;
    const params: any[] = [];
    if (opts.promo !== undefined) {
      params.push(opts.promo);
      query += ` AND sp.promotional_product = $${params.length}`;
    }
    if (opts.categoryNumber !== undefined && opts.categoryNumber !== null) {
      params.push(opts.categoryNumber);
      query += ` AND p.category_number = $${params.length}`;
    }

    const sortMap: Record<string, string> = {
      upc: 'sp.UPC',
      name: 'p.product_name',
      price: 'sp.selling_price',
      stock: 'sp.products_number',
      status: 'sp.promotional_product',
    };
    const col = opts.sort ? sortMap[opts.sort] : undefined;
    const dir =
      String(opts.order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    if (col) {
      query += ` ORDER BY ${col} ${dir}`;
    } else {
      query += ' ORDER BY sp.products_number DESC';
    }

    const rows: any[] = await this.dataSource.query(query, params);
    return rows.map((r) => ({
      upc: r.upc,
      name: r.product_name,
      price: Number(r.selling_price),
      stock: r.products_number,
      is_promo: r.promotional_product,
      id_product: r.id_product,
      category_number: r.category_number,
    }));
  }

  async findOne(upc: string) {
    const rows: any[] = await this.dataSource.query(
      `SELECT sp.UPC, sp.selling_price, sp.products_number,
              p.product_name, p.characteristics, sp.promotional_product
       FROM Store_Product sp
       JOIN Product p ON sp.id_product = p.id_product
       WHERE sp.UPC = $1`,
      [upc],
    );
    if (!rows || rows.length === 0) {
      throw new NotFoundException('Товар не знайдено');
    }
    const r = rows[0];
    return {
      upc: r.upc,
      price: Number(r.selling_price),
      quantity: r.products_number,
      name: r.product_name,
      characteristics: r.characteristics,
      is_promo: r.promotional_product,
    };
  }

  async create(dto: StoreProductDto) {
    const upc = randomBytes(6).toString('hex').toUpperCase();
    try {
      await this.dataSource.query(
        `INSERT INTO Store_Product
           (UPC, UPC_prom, id_product, selling_price, products_number, promotional_product)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          upc,
          null,
          dto.id_product,
          dto.selling_price,
          dto.products_number,
          dto.promotional_product,
        ],
      );
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
    return { message: 'Товар додано на склад' };
  }

  async update(upc: string, dto: StoreProductDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const existingRows: any[] = await qr.query(
        `SELECT id_product, selling_price FROM Store_Product WHERE UPC = $1 FOR UPDATE`,
        [upc],
      );
      if (!existingRows || existingRows.length === 0) {
        throw new NotFoundException('Товар не знайдено');
      }
      const existing = existingRows[0];

      await qr.query(
        `UPDATE Store_Product
         SET selling_price = $1, products_number = $2,
             promotional_product = $3
         WHERE UPC = $4`,
        [
          dto.selling_price,
          dto.products_number,
          dto.promotional_product,
          upc,
        ],
      );

      if (
        Number(existing.selling_price) !== Number(dto.selling_price) &&
        !dto.promotional_product
      ) {
        await qr.query(
          `UPDATE Store_Product
           SET selling_price = $1
           WHERE id_product = $2 AND promotional_product = FALSE AND UPC <> $3`,
          [dto.selling_price, existing.id_product, upc],
        );
      }

      await qr.commitTransaction();
    } catch (e) {
      await qr.rollbackTransaction();
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException((e as Error).message);
    } finally {
      await qr.release();
    }
    return { message: 'Дані на складі оновлено (переоцінка проведена)' };
  }

  async remove(upc: string) {
    try {
      const rows: any[] = await this.dataSource.query(
        `DELETE FROM Store_Product WHERE UPC = $1 RETURNING UPC`,
        [upc],
      );
      if (!rows || rows.length === 0) {
        throw new NotFoundException('Товар не знайдено');
      }
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException(
        'Не вдалося видалити (можливо, товар є в чеках)',
      );
    }
    return { message: 'Товар вилучено зі складу магазину' };
  }
}
