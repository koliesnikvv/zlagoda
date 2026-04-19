import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly authService: AuthService,
  ) {}

  private checkAge(dateOfBirth: string) {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    if (age < 18) {
      throw new BadRequestException('Працівник має бути старше 18 років');
    }
  }

  async register(dto: RegisterUserDto) {
    this.checkAge(dto.date_of_birth);

    const newId = randomBytes(4).toString('hex').toUpperCase();
    const hashed = await this.authService.hashPassword(dto.password);

    try {
      await this.dataSource.query(
        `INSERT INTO Employee (id_employee, email, empl_surname, empl_name, empl_patronymic,
                               empl_role, salary, date_of_birth, date_of_start, phone_number,
                               city, street, zip_code, password_hash)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          newId,
          dto.email,
          dto.empl_surname,
          dto.empl_name,
          dto.empl_patronymic ?? null,
          dto.empl_role,
          dto.empl_salary,
          dto.date_of_birth,
          dto.date_of_start,
          dto.phone_number,
          dto.city,
          dto.street,
          dto.zip_code,
          hashed,
        ],
      );
    } catch {
      throw new BadRequestException('Працівник з таким Email вже існує');
    }

    return {
      message: 'Працівника успішно зареєстровано',
      id_employee: newId,
    };
  }

  async findAll(
    role?: string,
    surname?: string,
    sort?: string,
    order?: string,
  ) {
    let query = `SELECT id_employee, empl_surname, empl_name, empl_patronymic, empl_role,
                        salary, phone_number, city, street, zip_code, email,
                        date_of_birth, date_of_start
                 FROM Employee WHERE 1=1`;
    const params: any[] = [];
    if (role) {
      params.push(role);
      query += ` AND empl_role = $${params.length}`;
    }
    if (surname) {
      params.push(`%${surname}%`);
      query += ` AND empl_surname ILIKE $${params.length}`;
    }

    const sortMap: Record<string, string> = {
      id: 'id_employee',
      name: 'empl_surname',
      email: 'email',
      role: 'empl_role',
      created_at: 'date_of_start',
    };
    const col = sort ? sortMap[sort] : undefined;
    const dir = String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    if (col) {
      query += ` ORDER BY ${col} ${dir}`;
    } else {
      query += ' ORDER BY empl_surname ASC';
    }

    const rows: any[] = await this.dataSource.query(query, params);
    return rows.map((r) => ({
      id_employee: r.id_employee,
      empl_surname: r.empl_surname,
      empl_name: r.empl_name,
      empl_patronymic: r.empl_patronymic,
      empl_role: r.empl_role,
      salary: Number(r.salary),
      phone_number: r.phone_number,
      city: r.city,
      street: r.street,
      zip_code: r.zip_code,
      email: r.email,
      date_of_birth: String(r.date_of_birth).slice(0, 10),
      date_of_start: String(r.date_of_start).slice(0, 10),
      id: r.id_employee,
      full_name:
        `${r.empl_surname} ${r.empl_name}` +
        (r.empl_patronymic ? ` ${r.empl_patronymic}` : ''),
      role: r.empl_role,
      created_at: String(r.date_of_start).slice(0, 10),
    }));
  }

  async getContact(idEmployee: string) {
    const rows: any[] = await this.dataSource.query(
      `SELECT phone_number, city, street, zip_code
       FROM Employee WHERE id_employee = $1`,
      [idEmployee],
    );
    if (!rows || rows.length === 0) {
      throw new NotFoundException('Працівника не знайдено');
    }
    const r = rows[0];
    return {
      phone_number: r.phone_number,
      city: r.city,
      street: r.street,
      zip_code: r.zip_code,
    };
  }

  async update(idEmployee: string, dto: UpdateUserDto) {
    this.checkAge(dto.date_of_birth);
    try {
      const rows: any[] = await this.dataSource.query(
        `UPDATE Employee
         SET email=$1, empl_role=$2, empl_surname=$3, empl_name=$4,
             empl_patronymic=$5, salary=$6, date_of_birth=$7,
             phone_number=$8, city=$9, street=$10, zip_code=$11
         WHERE id_employee = $12
         RETURNING id_employee`,
        [
          dto.email,
          dto.empl_role,
          dto.empl_surname,
          dto.empl_name,
          dto.empl_patronymic ?? null,
          dto.empl_salary,
          dto.date_of_birth,
          dto.phone_number,
          dto.city,
          dto.street,
          dto.zip_code,
          idEmployee,
        ],
      );
      if (!rows || rows.length === 0) {
        throw new NotFoundException('Працівника не знайдено');
      }
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException((e as Error).message);
    }
    return { message: 'Дані працівника оновлено' };
  }

  async remove(idEmployee: string) {
    try {
      const rows: any[] = await this.dataSource.query(
        `DELETE FROM Employee WHERE id_employee = $1 RETURNING id_employee`,
        [idEmployee],
      );
      if (!rows || rows.length === 0) {
        throw new NotFoundException('Працівника не знайдено');
      }
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException(
        "Неможливо видалити працівника (є зв'язані чеки)",
      );
    }
    return { message: 'Працівника видалено' };
  }
}
