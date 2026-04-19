import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCustomerCardDto {
  @IsString()
  @MaxLength(13)
  card_number!: string;

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
  @Matches(/^\+/, { message: "Номер телефону має починатися з '+'" })
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
