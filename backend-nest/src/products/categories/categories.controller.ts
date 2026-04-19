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
import { CategoriesService } from './categories.service';
import { CategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  findAll(@Query('sort') sort?: string, @Query('order') order?: string) {
    return this.service.findAll(sort, order);
  }

  @Post()
  @Roles('Manager')
  create(@Body() dto: CategoryDto) {
    return this.service.create(dto);
  }

  @Put(':category_number')
  @Roles('Manager')
  update(
    @Param('category_number', ParseIntPipe) id: number,
    @Body() dto: CategoryDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':category_number')
  @Roles('Manager')
  remove(@Param('category_number', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
