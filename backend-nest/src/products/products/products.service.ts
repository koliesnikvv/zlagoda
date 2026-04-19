import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(categoryNumber?: number, sort?: string, order?: string) {
    let query = `SELECT p.id_product, p.category_number, c.category_name,
                        p.product_name, p.manufacturer, p.characteristics
                 FROM Product p
                 JOIN Category c ON p.category_number = c.category_number
                 WHERE 1=1`;
    const params: any[] = [];
    if (categoryNumber !== undefined && categoryNumber !== null) {
      params.push(categoryNumber);
      query += ` AND p.category_number = $${params.length}`;
    }

    const sortMap: Record<string, string> = {
      id: 'p.id_product',
      name: 'p.product_name',
      category: 'c.category_name',
      manufacturer: 'p.manufacturer',
      characteristics: 'p.characteristics',
    };
    const col = sort ? sortMap[sort] : undefined;
    const dir = String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    if (col) {
      query += ` ORDER BY ${col} ${dir}`;
    } else {
      query += ' ORDER BY p.product_name ASC';
    }

    const rows: any[] = await this.dataSource.query(query, params);
    return rows.map((r) => ({
      id_product: r.id_product,
      category_number: r.category_number,
      category_name: r.category_name,
      product_name: r.product_name,
      manufacturer: r.manufacturer,
      characteristics: r.characteristics,
    }));
  }

  async create(dto: ProductDto) {
    try {
      const rows: any[] = await this.dataSource.query(
        `INSERT INTO Product (category_number, product_name, manufacturer, characteristics)
         VALUES ($1, $2, $3, $4) RETURNING id_product`,
        [
          dto.category_number,
          dto.product_name,
          dto.manufacturer,
          dto.characteristics,
        ],
      );
      return {
        id_product: rows[0].id_product,
        message: 'Товар додано',
      };
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }

  async update(productId: number, dto: ProductDto) {
    try {
      const rows: any[] = await this.dataSource.query(
        `UPDATE Product
         SET category_number = $1, product_name = $2,
             manufacturer = $3, characteristics = $4
         WHERE id_product = $5
         RETURNING id_product`,
        [
          dto.category_number,
          dto.product_name,
          dto.manufacturer,
          dto.characteristics,
          productId,
        ],
      );
      if (!rows || rows.length === 0) {
        throw new NotFoundException('Товар не знайдено');
      }
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException(
        `Помилка оновлення: ${(e as Error).message}`,
      );
    }
    return { message: 'Дані про товар оновлено' };
  }

  async remove(productId: number) {
    try {
      const rows: any[] = await this.dataSource.query(
        `DELETE FROM Product WHERE id_product = $1 RETURNING id_product`,
        [productId],
      );
      if (!rows || rows.length === 0) {
        throw new NotFoundException('Товар не знайдено');
      }
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException(
        'Неможливо видалити: товар використовується в магазині',
      );
    }
    return { message: 'Товар вилучено з каталогу' };
  }
}
