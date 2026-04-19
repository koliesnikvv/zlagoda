import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../users/entities/employee.entity';
import { Category } from '../products/categories/entities/category.entity';
import { Product } from '../products/products/entities/product.entity';
import { StoreProduct } from '../products/store-products/entities/store-product.entity';
import { CustomerCard } from '../customer-cards/entities/customer-card.entity';
import { Check } from '../check/entities/check.entity';
import { Sale } from '../check/entities/sale.entity';
import { SchemaInitService } from './schema-init.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        return {
          type: 'postgres',
          url,
          entities: [
            Employee,
            Category,
            Product,
            StoreProduct,
            CustomerCard,
            Check,
            Sale,
          ],
          synchronize: false,
        };
      },
    }),
  ],
  providers: [SchemaInitService],
  exports: [SchemaInitService],
})
export class DatabaseModule {}
