import type { CategoryDto } from '@domain/categories/dto/entity/category.dto';
import { CategoriesService } from '@domain/categories/services/categories.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SelectQueryResult } from '@vritti/api-sdk';
import type { CreateCategoryDto } from './dto/request/create-category.dto';
import type { UpdateCategoryDto } from './dto/request/update-category.dto';

@Controller()
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  // Returns paginated category options for the select component (RLS scopes results)
  @MessagePattern({ cmd: 'categories.select' })
  async select(
    @Payload() data: { search?: string; limit?: number; offset?: number; values?: string; excludeIds?: string },
  ): Promise<SelectQueryResult> {
    this.logger.log('categories.select');
    return this.categoriesService.findForSelect(data);
  }

  // Lists all categories (RLS scopes to org + BU ancestors)
  @MessagePattern({ cmd: 'categories.list' })
  async list(): Promise<CategoryDto[]> {
    this.logger.log('categories.list');
    return this.categoriesService.list();
  }

  // Creates a new category (org_id/bu_id auto-filled by DB defaults from session vars)
  @MessagePattern({ cmd: 'categories.create' })
  async create(@Payload() dto: CreateCategoryDto): Promise<CategoryDto> {
    this.logger.log(`categories.create — name: ${dto.name}`);
    return this.categoriesService.create(dto);
  }

  // Finds a category by ID (RLS scopes visibility)
  @MessagePattern({ cmd: 'categories.findById' })
  async findById(@Payload() data: { id: string }): Promise<CategoryDto> {
    this.logger.log(`categories.findById — id: ${data.id}`);
    return this.categoriesService.findById(data.id);
  }

  // Updates a category by ID
  @MessagePattern({ cmd: 'categories.update' })
  async update(@Payload() data: { id: string } & UpdateCategoryDto): Promise<CategoryDto> {
    const { id, ...updateData } = data;
    this.logger.log(`categories.update — id: ${id}`);
    return this.categoriesService.update(id, updateData);
  }

  // Deletes a category by ID
  @MessagePattern({ cmd: 'categories.delete' })
  async delete(@Payload() data: { id: string }): Promise<{ success: boolean; message: string }> {
    this.logger.log(`categories.delete — id: ${data.id}`);
    return this.categoriesService.delete(data.id);
  }
}
