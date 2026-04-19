import { Controller, Get, Query } from '@nestjs/common';
import { CustomerAnalyticsService } from './customer-analytics.service';

@Controller('analytics')
export class CustomerAnalyticsController {
  constructor(private readonly analyticsService: CustomerAnalyticsService) {}


  @Get('loyal-customers')
  async getLoyal(@Query('manufacturer') manufacturer: string) {

    return await this.analyticsService.getLoyalCustomers(manufacturer);
  }
}