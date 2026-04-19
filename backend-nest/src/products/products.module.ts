import { Module } from '@nestjs/common';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { StoreProductsController } from './store-products/store-products.controller';
import { StoreProductsService } from './store-products/store-products.service';

@Module({
  controllers: [
    CategoriesController,
    ProductsController,
    StoreProductsController,
  ],
  providers: [CategoriesService, ProductsService, StoreProductsService],
  exports: [CategoriesService, ProductsService, StoreProductsService],
})
export class ProductsModule {}
