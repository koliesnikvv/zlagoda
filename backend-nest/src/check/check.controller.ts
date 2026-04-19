import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CheckService } from './check.service';
import { CreateCheckDto } from './dto/create-check.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CheckController {
  constructor(private readonly service: CheckService) {}

  @Post()
  @Roles('Cashier')
  create(@Body() dto: CreateCheckDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('id_employee') idEmployee?: string,
    @Query('today_only') todayOnly?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
  ) {
    return this.service.findAll({
      user,
      startDate,
      endDate,
      idEmployee,
      todayOnly: todayOnly === 'true' || todayOnly === '1',
      sort,
      order,
    });
  }

  @Get(':check_number')
  findOne(
    @Param('check_number') checkNumber: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(checkNumber, user);
  }

  @Delete(':check_number')
  @Roles('Manager')
  remove(@Param('check_number') checkNumber: string) {
    return this.service.remove(checkNumber);
  }
}
