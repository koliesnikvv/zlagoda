import { IsString, MaxLength } from 'class-validator';

export class CategoryDto {
  @IsString()
  @MaxLength(50)
  category_name!: string;
}
