import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import type { SelectQueryResult } from '@vritti/api-sdk';
import { CategoriesService } from '@domain/categories/services/categories.service';
import type { CategoryDto } from '@domain/categories/dto/category.dto';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';

@Controller()
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  // Returns paginated category options for the select component
  @MessagePattern({ cmd: 'categories.select' })
  async select(data: {
    organizationId: string;
    businessUnitId: string;
    search?: string;
    limit?: number;
    offset?: number;
    values?: string;
    excludeIds?: string;
  }): Promise<SelectQueryResult> {
    this.logger.log(`categories.select — buId: ${data.businessUnitId}`);
    return this.categoriesService.findForSelect(data);
  }

  // Lists all categories for a business unit
  @MessagePattern({ cmd: 'categories.list' })
  async list(data: { organizationId: string; businessUnitId: string }): Promise<CategoryDto[]> {
    this.logger.log(`categories.list — buId: ${data.businessUnitId}`);
    return this.categoriesService.list(data.organizationId, data.businessUnitId);
  }

  // Creates a new category
  @MessagePattern({ cmd: 'categories.create' })
  async create(data: CreateCategoryDto): Promise<CategoryDto> {
    this.logger.log(`categories.create — buId: ${data.businessUnitId}`);
    return this.categoriesService.create(data);
  }

  // Finds a category by ID
  @MessagePattern({ cmd: 'categories.findById' })
  async findById(data: { id: string }): Promise<CategoryDto> {
    this.logger.log(`categories.findById — id: ${data.id}`);
    return this.categoriesService.findById(data.id);
  }

  // Updates a category by ID
  @MessagePattern({ cmd: 'categories.update' })
  async update(data: { id: string } & UpdateCategoryDto): Promise<CategoryDto> {
    const { id, ...updateData } = data;
    this.logger.log(`categories.update — id: ${id}`);
    return this.categoriesService.update(id, updateData);
  }

  // Deletes a category by ID
  @MessagePattern({ cmd: 'categories.delete' })
  async delete(data: { id: string }): Promise<{ success: boolean; message: string }> {
    this.logger.log(`categories.delete — id: ${data.id}`);
    return this.categoriesService.delete(data.id);
  }
}
