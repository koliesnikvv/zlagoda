import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class SaleItemDto {
  @IsString()
  UPC!: string;

  @IsInt()
  @Min(1)
  product_number!: number;
}

export class CreateCheckDto {
  @IsOptional()
  @IsString()
  @MaxLength(13)
  card_number?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];
}
