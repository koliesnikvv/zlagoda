import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateCustomerCardDto {
  @IsString()
  @MaxLength(50)
  cust_surname!: string;

  @IsString()
  @MaxLength(50)
  cust_name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  cust_patronymic?: string | null;

  @IsString()
  @MaxLength(13)
  phone_number!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  street?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(9)
  zip_code?: string | null;

  @IsInt()
  @Min(0)
  @Max(100)
  percent!: number;
}
