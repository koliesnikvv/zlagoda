import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Manager')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('reports/total-sales')
  totalSales(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('id_employee') idEmployee?: string,
  ) {
    return this.service.totalSales(startDate, endDate, idEmployee);
  }

  @Get('reports/product-sold')
  productSold(
    @Query('upc') upc: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.service.productSold(upc, startDate, endDate);
  }

  @Get('report')
  salesReport(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.service.salesReport(startDate, endDate);
  }

  @Get('report/products')
  productsReport() {
    return this.service.inventoryReport();
  }
}
