import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async login(dto: LoginDto) {
    const rows: Array<{
      id_employee: string;
      password_hash: string;
      empl_role: 'Manager' | 'Cashier';
      empl_name: string;
      empl_surname: string;
    }> = await this.dataSource.query(
      `SELECT id_employee, password_hash, empl_role, empl_name, empl_surname
       FROM Employee
       WHERE email = $1`,
      [dto.email],
    );

    if (!rows || rows.length === 0) {
      throw new UnauthorizedException('Користувача з таким email не знайдено');
    }

    const user = rows[0];
    const ok = await this.comparePassword(dto.password, user.password_hash);
    if (!ok) {
      throw new UnauthorizedException('Невірний пароль');
    }

    const token = this.jwtService.sign({
      user_id: user.id_employee,
      role: user.empl_role,
      email: dto.email,
      name: user.empl_name,
      surname: user.empl_surname,
    });

    return {
      token,
      role: user.empl_role,
      name: user.empl_name,
      surname: user.empl_surname,
    };
  }

  async getMe(userId: string) {
    const rows: Array<any> = await this.dataSource.query(
      `SELECT id_employee, empl_surname, empl_name, empl_patronymic, empl_role,
              salary, date_of_birth, date_of_start, phone_number,
              city, street, zip_code, email
       FROM Employee
       WHERE id_employee = $1`,
      [userId],
    );

    if (!rows || rows.length === 0) {
      throw new NotFoundException('Працівника не знайдено');
    }
    const r = rows[0];
    return {
      id_employee: r.id_employee,
      empl_surname: r.empl_surname,
      empl_name: r.empl_name,
      empl_patronymic: r.empl_patronymic,
      empl_role: r.empl_role,
      salary: Number(r.salary),
      date_of_birth: String(r.date_of_birth).slice(0, 10),
      date_of_start: String(r.date_of_start).slice(0, 10),
      phone_number: r.phone_number,
      city: r.city,
      street: r.street,
      zip_code: r.zip_code,
      email: r.email,
    };
  }
}
