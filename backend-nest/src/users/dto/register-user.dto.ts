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
import { ApiProperty } from '@nestjs/swagger';


export class RegisterUserDto {
    @ApiProperty({ description: 'Employee surname', example: 'Petrenko'})
  @IsString()
  @MaxLength(50)
  empl_surname!: string;

        @ApiProperty({ description: 'Employee name', example: 'Pavlo'})
  @IsString()
  @MaxLength(50)
  empl_name!: string;

        @ApiProperty({ description: 'Employee patronymic', example: 'Petrovych'})
  @IsOptional()
  @IsString()
  @MaxLength(50)
  empl_patronymic?: string | null;

        @ApiProperty({ description: 'Employee role', example: 'Manager'})
  @IsIn(['Manager', 'Cashier'])
  empl_role!: 'Manager' | 'Cashier';

        @ApiProperty({ description: 'Employee salary', example: '60000'})
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  empl_salary!: number;

        @ApiProperty({ description: 'Employee date of birth', example: '23.09.1999'})
  @IsDateString()
  date_of_birth!: string;

        @ApiProperty({ description: 'Employee date of start', example: '12.07.2023'})
  @IsDateString()
  date_of_start!: string;

          @ApiProperty({ description: 'Employee phone number', example: '+380999999999'})
  @IsString()
  @MaxLength(13)
  @Matches(/^\+/, { message: "Номер телефону має починатися з '+'" })
  phone_number!: string;

          @ApiProperty({ description: 'Employee city', example: 'Lviv'})
  @IsString()
  @MaxLength(50)
  city!: string;

          @ApiProperty({ description: 'Employee street address', example: 'Tarasa Shevchenka'})
  @IsString()
  @MaxLength(50)
  street!: string;

          @ApiProperty({ description: 'Employee zip', example: '99999999'})
  @IsString()
  @MaxLength(9)
  zip_code!: string;

          @ApiProperty({ description: 'Employee password', example: 'jjnhkjn6777'})
  @IsString()
  @MinLength(8)
  password!: string;

          @ApiProperty({ description: 'Employee email', example: 'email@email.com'})
  @IsEmail()
  email!: string;
}
