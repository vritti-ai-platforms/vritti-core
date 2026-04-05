import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import {
  ApiCreateCategory,
  ApiDeleteCategory,
  ApiGetCategory,
  ApiListCategories,
  ApiUpdateCategory,
} from './docs/categories-gateway.docs';
import type { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
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
  async list(@UserId() userId: string, @Query('buId') buId: string): Promise<CategoryResponseDto[]> {
    this.logger.log(`GET /commerce-api/categories?buId=${buId} — user: ${userId}`);
    return this.categoriesGatewayService.list(userId, buId);
  }

  // Creates a new category
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateCategory()
  async create(@UserId() userId: string, @Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    this.logger.log(`POST /commerce-api/categories — user: ${userId}`);
    return this.categoriesGatewayService.create(userId, dto);
  }

  // Returns a single category by ID
  @Get(':id')
  @ApiGetCategory()
  async findById(@UserId() userId: string, @Param('id') id: string): Promise<CategoryResponseDto> {
    this.logger.log(`GET /commerce-api/categories/${id} — user: ${userId}`);
    return this.categoriesGatewayService.findById(id);
  }

  // Updates a category by ID
  @Patch(':id')
  @ApiUpdateCategory()
  async update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    this.logger.log(`PATCH /commerce-api/categories/${id} — user: ${userId}`);
    return this.categoriesGatewayService.update(userId, id, dto);
  }

  // Deletes a category by ID
  @Delete(':id')
  @ApiDeleteCategory()
  async delete(@UserId() userId: string, @Param('id') id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`DELETE /commerce-api/categories/${id} — user: ${userId}`);
    return this.categoriesGatewayService.delete(id);
  }
}
