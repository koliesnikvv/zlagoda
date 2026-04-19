import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(sort?: string, order?: string) {
    const sortMap: Record<string, string> = {
      number: 'category_number',
      name: 'category_name',
    };
    const col = sort ? sortMap[sort] : undefined;
    const dir = String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const orderBy = col
      ? `ORDER BY ${col} ${dir}`
      : 'ORDER BY category_name ASC';

    const rows: any[] = await this.dataSource.query(
      `SELECT category_number, category_name FROM Category ${orderBy}`,
    );
    return rows.map((r) => ({
      category_number: r.category_number,
      category_name: r.category_name,
    }));
  }

  async create(dto: CategoryDto) {
    try {
      const rows: any[] = await this.dataSource.query(
        `INSERT INTO Category (category_name) VALUES ($1) RETURNING category_number`,
        [dto.category_name],
      );
      return {
        category_number: rows[0].category_number,
        category_name: dto.category_name,
      };
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }

  async update(categoryNumber: number, dto: CategoryDto) {
    try {
      const rows: any[] = await this.dataSource.query(
        `UPDATE Category SET category_name = $1
         WHERE category_number = $2 RETURNING category_number`,
        [dto.category_name, categoryNumber],
      );
      if (!rows || rows.length === 0) {
        throw new NotFoundException('Категорію не знайдено');
      }
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException((e as Error).message);
    }
    return { message: 'Категорію оновлено' };
  }

  async remove(categoryNumber: number) {
    try {
      const rows: any[] = await this.dataSource.query(
        `DELETE FROM Category WHERE category_number = $1 RETURNING category_number`,
        [categoryNumber],
      );
      if (!rows || rows.length === 0) {
        throw new NotFoundException('Категорію не знайдено');
      }
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException(
        "Неможливо видалити: до категорії прив'язані товари",
      );
    }
    return { message: 'Категорію видалено' };
  }
}
