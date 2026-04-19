
import { Module } from '@nestjs/common';
import { CustomerAnalyticsController } from './customer-analytics.controller';
import { CustomerAnalyticsService } from './customer-analytics.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {CustomerCard} from "../customer-cards/entities/customer-card.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CustomerCard])],
  controllers: [CustomerAnalyticsController],
  providers: [CustomerAnalyticsService],
})
export class CustomerModule {}

