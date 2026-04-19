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
import { CustomerCardsService } from './customer-cards.service';
import { CreateCustomerCardDto } from './dto/create-customer-card.dto';
import { UpdateCustomerCardDto } from './dto/update-customer-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('customer-cards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerCardsController {
  constructor(private readonly service: CustomerCardsService) {}

  @Get()
  findAll(
    @Query('percent') percent?: string,
    @Query('surname') surname?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
  ) {
    const p =
      percent === undefined || percent === '' ? undefined : Number(percent);
    return this.service.findAll(p, surname, sort, order);
  }

  @Get(':card_number')
  findOne(@Param('card_number') cardNumber: string) {
    return this.service.findOne(cardNumber);
  }

  @Post()
  @Roles('Manager', 'Cashier')
  create(@Body() dto: CreateCustomerCardDto) {
    return this.service.create(dto);
  }

  @Put(':card_number')
  @Roles('Manager', 'Cashier')
  update(
    @Param('card_number') cardNumber: string,
    @Body() dto: UpdateCustomerCardDto,
  ) {
    return this.service.update(cardNumber, dto);
  }

  @Delete(':card_number')
  @Roles('Manager')
  remove(@Param('card_number') cardNumber: string) {
    return this.service.remove(cardNumber);
  }
}
