import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  findAll(
    @Query('category_number') categoryNumber?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
  ) {
    const cat =
      categoryNumber !== undefined && categoryNumber !== ''
        ? Number(categoryNumber)
        : undefined;
    return this.service.findAll(cat, sort, order);
  }

  @Post()
  @Roles('Manager')
  create(@Body() dto: ProductDto) {
    return this.service.create(dto);
  }

  @Put(':product_id')
  @Roles('Manager')
  update(
    @Param('product_id', ParseIntPipe) id: number,
    @Body() dto: ProductDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':product_id')
  @Roles('Manager')
  remove(@Param('product_id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
