import { IsInt, IsString, MaxLength } from 'class-validator';

export class ProductDto {
  @IsInt()
  category_number!: number;

  @IsString()
  @MaxLength(50)
  product_name!: string;

  @IsString()
  @MaxLength(50)
  manufacturer!: string;

  @IsString()
  @MaxLength(100)
  characteristics!: string;
}
