import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, Min } from 'class-validator';

export class StoreProductDto {
  @IsInt()
  id_product!: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  selling_price!: number;

  @IsInt()
  @Min(0)
  products_number!: number;

  @IsBoolean()
  promotional_product!: boolean;
}
