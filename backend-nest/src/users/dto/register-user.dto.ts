import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @MaxLength(50)
  empl_surname!: string;

  @IsString()
  @MaxLength(50)
  empl_name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  empl_patronymic?: string | null;

  @IsIn(['Manager', 'Cashier'])
  empl_role!: 'Manager' | 'Cashier';

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  empl_salary!: number;

  @IsDateString()
  date_of_birth!: string;

  @IsDateString()
  date_of_start!: string;

  @IsString()
  @MaxLength(13)
  @Matches(/^\+/, { message: "Номер телефону має починатися з '+'" })
  phone_number!: string;

  @IsString()
  @MaxLength(50)
  city!: string;

  @IsString()
  @MaxLength(50)
  street!: string;

  @IsString()
  @MaxLength(9)
  zip_code!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEmail()
  email!: string;
}
