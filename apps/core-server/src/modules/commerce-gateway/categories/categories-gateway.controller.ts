import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import {
  ApiCreateCategory,
  ApiDeleteCategory,
  ApiGetCategory,
  ApiGetCategoriesSelect,
  ApiListCategories,
  ApiUpdateCategory,
} from './docs/categories-gateway.docs';
import { CreateCategoryDto } from './dto/request/create-category.dto';
import { UpdateCategoryDto } from './dto/request/update-category.dto';
import type { CategoryResponseDto } from './dto/response/category-response.dto';
import { CategoriesGatewayService } from './services/categories-gateway.service';

@ApiTags('Commerce - Categories')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('categories')
export class CategoriesGatewayController {
  private readonly logger = new Logger(CategoriesGatewayController.name);

  constructor(private readonly categoriesGatewayService: CategoriesGatewayService) {}

  // Returns all categories for a business unit
  @Get()
  @ApiListCategories()
  async list(): Promise<CategoryResponseDto[]> {
    return this.categoriesGatewayService.list();
  }

  // Creates a new category
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateCategory()
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.categoriesGatewayService.create(dto);
  }

  // Returns paginated category options for the select component
  @Get('select')
  @ApiGetCategoriesSelect()
  async select(@Query() query: SelectOptionsQueryDto & { buId: string }): Promise<SelectQueryResult> {
    return this.categoriesGatewayService.select(query);
  }

  // Returns a single category by ID
  @Get(':id')
  @ApiGetCategory()
  async findById(@Param('id') id: string): Promise<CategoryResponseDto> {
    return this.categoriesGatewayService.findById(id);
  }

  // Updates a category by ID
  @Patch(':id')
  @ApiUpdateCategory()
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    return this.categoriesGatewayService.update(id, dto);
  }

  // Deletes a category by ID
  @Delete(':id')
  @ApiDeleteCategory()
  async delete(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.categoriesGatewayService.delete(id);
  }
}
