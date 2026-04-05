import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CategoryDto } from '../dto/category.dto';
import type { CreateCategoryDto } from '../dto/create-category.dto';
import type { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoriesRepository } from '../repositories/categories.repository';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  // Returns all categories for a business unit
  async list(orgId: string, buId: string): Promise<CategoryDto[]> {
    const entities = await this.categoriesRepository.findByBu(orgId, buId);
    return entities.map(CategoryDto.from);
  }

  // Creates a new category and returns the entity DTO
  async create(data: CreateCategoryDto): Promise<CategoryDto> {
    const entity = await this.categoriesRepository.create(data);
    this.logger.log(`Created category: ${entity.name} (${entity.id})`);
    return CategoryDto.from(entity);
  }

  // Finds a category by ID or throws NotFoundException
  async findById(id: string): Promise<CategoryDto> {
    const entity = await this.categoriesRepository.findById(id);
    if (!entity) throw new NotFoundException('Category not found.');
    return CategoryDto.from(entity);
  }

  // Updates a category and returns the updated entity DTO
  async update(id: string, data: UpdateCategoryDto): Promise<CategoryDto> {
    const existing = await this.categoriesRepository.findById(id);
    if (!existing) throw new NotFoundException('Category not found.');
    const entity = await this.categoriesRepository.update(id, data);
    this.logger.log(`Updated category: ${entity.name} (${entity.id})`);
    return CategoryDto.from(entity);
  }

  // Deletes a category by ID
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.categoriesRepository.findById(id);
    if (!existing) throw new NotFoundException('Category not found.');
    await this.categoriesRepository.delete(id);
    this.logger.log(`Deleted category: ${id}`);
    return { success: true, message: 'Category deleted successfully.' };
  }
}
