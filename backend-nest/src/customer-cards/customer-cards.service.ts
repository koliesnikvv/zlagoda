import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateCustomerCardDto } from './dto/create-customer-card.dto';
import { UpdateCustomerCardDto } from './dto/update-customer-card.dto';

@Injectable()
export class CustomerCardsService {
  constructor(private readonly dataSource: DataSource) {}

  private mapRow(r: any) {
    return {
      card_number: r.card_number,
      cust_surname: r.cust_surname,
      cust_name: r.cust_name,
      cust_patronymic: r.cust_patronymic,
      phone_number: r.phone_number,
      city: r.city,
      street: r.street,
      zip_code: r.zip_code,
      percent: r.percent,
    };
  }

  async findAll(
    percent?: number,
    surname?: string,
    sort?: string,
    order?: string,
  ) {
    let query = `SELECT card_number, cust_surname, cust_name, cust_patronymic,
                        phone_number, city, street, zip_code, percent
                 FROM Customer_Card WHERE 1=1`;
    const params: any[] = [];
    if (percent !== undefined && percent !== null) {
      params.push(percent);
      query += ` AND percent = $${params.length}`;
    }
    if (surname) {
      params.push(`%${surname}%`);
      query += ` AND cust_surname ILIKE $${params.length}`;
    }

    const sortMap: Record<string, string> = {
      card_number: 'card_number',
      surname: 'cust_surname',
      name: 'cust_name',
      phone: 'phone_number',
      city: 'city',
      percent: 'percent',
    };
    const col = sort ? sortMap[sort] : undefined;
    const dir = String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    if (col) {
      query += ` ORDER BY ${col} ${dir}`;
    } else {
      query += ' ORDER BY cust_surname ASC';
    }

    const rows: any[] = await this.dataSource.query(query, params);
    return rows.map((r) => this.mapRow(r));
  }

  async findOne(cardNumber: string) {
    const rows: any[] = await this.dataSource.query(
      `SELECT card_number, cust_surname, cust_name, cust_patronymic,
              phone_number, city, street, zip_code, percent
       FROM Customer_Card WHERE card_number = $1`,
      [cardNumber],
    );
    if (!rows || rows.length === 0) {
      throw new NotFoundException('Картку не знайдено');
    }
    return this.mapRow(rows[0]);
  }

  async create(dto: CreateCustomerCardDto) {
    try {
      await this.dataSource.query(
        `INSERT INTO Customer_Card (card_number, cust_surname, cust_name, cust_patronymic,
                                    phone_number, city, street, zip_code, percent)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          dto.card_number,
          dto.cust_surname,
          dto.cust_name,
          dto.cust_patronymic ?? null,
          dto.phone_number,
          dto.city ?? null,
          dto.street ?? null,
          dto.zip_code ?? null,
          dto.percent,
        ],
      );
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
    return { message: 'Картку клієнта додано' };
  }

  async update(cardNumber: string, dto: UpdateCustomerCardDto) {
    try {
      const rows: any[] = await this.dataSource.query(
        `UPDATE Customer_Card
         SET cust_surname=$1, cust_name=$2, cust_patronymic=$3,
             phone_number=$4, city=$5, street=$6, zip_code=$7, percent=$8
         WHERE card_number = $9
         RETURNING card_number`,
        [
          dto.cust_surname,
          dto.cust_name,
          dto.cust_patronymic ?? null,
          dto.phone_number,
          dto.city ?? null,
          dto.street ?? null,
          dto.zip_code ?? null,
          dto.percent,
          cardNumber,
        ],
      );
      if (!rows || rows.length === 0) {
        throw new NotFoundException('Картку не знайдено');
      }
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException((e as Error).message);
    }
    return { message: 'Картку оновлено' };
  }

  async remove(cardNumber: string) {
    try {
      const rows: any[] = await this.dataSource.query(
        `DELETE FROM Customer_Card WHERE card_number = $1 RETURNING card_number`,
        [cardNumber],
      );
      if (!rows || rows.length === 0) {
        throw new NotFoundException('Картку не знайдено');
      }
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException(
        "Неможливо видалити: до картки прив'язані чеки",
      );
    }
    return { message: 'Картку видалено' };
  }
}
