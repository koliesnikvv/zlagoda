import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StoreProductsService } from './store-products.service';
import { StoreProductDto } from './dto/store-product.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller()
export class StoreProductsController {
  constructor(private readonly service: StoreProductsService) {}

  @Get('products')
  findAll(
    @Query('promo') promo?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('category_number') categoryNumber?: string,
  ) {
    const promoBool =
      promo === undefined || promo === ''
        ? undefined
        : promo === 'true' || promo === '1';
    const cat =
      categoryNumber === undefined || categoryNumber === ''
        ? undefined
        : Number(categoryNumber);
    return this.service.findAll({
      promo: promoBool,
      sort,
      order,
      categoryNumber: cat,
    });
  }

  @Get('store-products/:upc')
  findOne(@Param('upc') upc: string) {
    return this.service.findOne(upc);
  }

  @Post('store-products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Manager')
  create(@Body() dto: StoreProductDto) {
    return this.service.create(dto);
  }

  @Put('store-products/:upc')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Manager')
  update(@Param('upc') upc: string, @Body() dto: StoreProductDto) {
    return this.service.update(upc, dto);
  }

  @Delete('store-products/:upc')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Manager')
  remove(@Param('upc') upc: string) {
    return this.service.remove(upc);
  }
}
