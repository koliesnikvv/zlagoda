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
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @Roles('Manager')
  register(@Body() dto: RegisterUserDto) {
    return this.usersService.register(dto);
  }

  @Get('users')
  @Roles('Manager')
  findAll(
    @Query('role') role?: string,
    @Query('surname') surname?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
  ) {
    return this.usersService.findAll(role, surname, sort, order);
  }

  @Get('users/:id_employee/contact')
  @Roles('Manager')
  getContact(@Param('id_employee') idEmployee: string) {
    return this.usersService.getContact(idEmployee);
  }

  @Put('users/:id_employee')
  @Roles('Manager')
  update(
    @Param('id_employee') idEmployee: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(idEmployee, dto);
  }

  @Delete('users/:id_employee')
  @Roles('Manager')
  remove(@Param('id_employee') idEmployee: string) {
    return this.usersService.remove(idEmployee);
  }
}
