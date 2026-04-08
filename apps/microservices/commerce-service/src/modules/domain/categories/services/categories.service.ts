import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { SelectQueryResult } from '@vritti/api-sdk';
import { CategoryDto } from '../dto/entity/category.dto';
import type { CreateCategoryDto } from '@/modules/categories/dto/request/create-category.dto';
import type { UpdateCategoryDto } from '@/modules/categories/dto/request/update-category.dto';
import { CategoriesRepository } from '../repositories/categories.repository';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  // Returns paginated category options for the select component (RLS scopes results)
  findForSelect(params: {
    search?: string;
    limit?: number;
    offset?: number;
    values?: string;
    excludeIds?: string;
  }): Promise<SelectQueryResult> {
    const { search, limit, offset, values, excludeIds } = params;
    return this.categoriesRepository.findForSelect({
      value: 'id',
      label: 'name',
      search,
      limit,
      offset,
      values,
      excludeIds,
      orderBy: { name: 'asc' },
    });
  }

  // Returns all categories (RLS scopes to org + BU ancestors)
  async list(): Promise<CategoryDto[]> {
    const entities = await this.categoriesRepository.findAll();
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

    if (data.parentId) {
      await this.assertNoCircularReference(id, data.parentId);
    }

    const entity = await this.categoriesRepository.update(id, data);
    this.logger.log(`Updated category: ${entity.name} (${entity.id})`);
    return CategoryDto.from(entity);
  }

  // Traverses the parent chain from ancestorId upward; throws if categoryId appears in the chain
  private async assertNoCircularReference(categoryId: string, proposedParentId: string): Promise<void> {
    let currentId: string | null = proposedParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === categoryId) {
        throw new BadRequestException(
          'Circular reference detected: a category cannot be set as a descendant of itself.',
        );
      }
      if (visited.has(currentId)) break; // guard against existing cycles in data
      visited.add(currentId);

      const node = await this.categoriesRepository.findById(currentId);
      currentId = node?.parentId ?? null;
    }
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
