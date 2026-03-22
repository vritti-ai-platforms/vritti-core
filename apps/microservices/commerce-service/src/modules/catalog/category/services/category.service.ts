import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, NotFoundException, SuccessResponseDto } from '@vritti/api-sdk';
import { CategoryDto } from '../dto/entity/category.dto';
import type { CreateCategoryDto } from '../dto/request/create-category.dto';
import type { UpdateCategoryDto } from '../dto/request/update-category.dto';
import { CategoryRepository } from '../repositories/category.repository';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private readonly categoryRepository: CategoryRepository) {}

  // Creates a new category
  async create(dto: CreateCategoryDto): Promise<CategoryDto> {
    const category = await this.categoryRepository.create({
      organizationId: dto.organizationId,
      businessUnitId: dto.businessUnitId,
      name: dto.name,
      image: dto.image ?? null,
      parentId: dto.parentId ?? null,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });

    this.logger.log(`Created category "${dto.name}" (${category.id})`);
    return CategoryDto.from(category);
  }

  // Returns all active categories for an org+bu
  async findAll(orgId: string, buId: string): Promise<CategoryDto[]> {
    const categories = await this.categoryRepository.findByOrgAndBu(orgId, buId);
    return categories.map(CategoryDto.from);
  }

  // Returns a single category by ID
  async findById(id: string): Promise<CategoryDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundException('Category not found.');
    return CategoryDto.from(category);
  }

  // Updates a category's fields
  async update(id: string, dto: UpdateCategoryDto): Promise<SuccessResponseDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundException('Category not found.');

    await this.categoryRepository.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.image !== undefined && { image: dto.image }),
      ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      updatedAt: new Date(),
    });

    this.logger.log(`Updated category ${id}`);
    return { success: true, message: 'Category updated successfully.' };
  }

  // Deletes a category after checking no products reference it
  async delete(id: string): Promise<SuccessResponseDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundException('Category not found.');

    const productCount = await this.categoryRepository.countProductReferences(id);
    if (productCount > 0) {
      throw new BadRequestException({
        label: 'Cannot Delete',
        detail: `This category has ${productCount} product(s) referencing it. Remove or reassign them first.`,
      });
    }

    await this.categoryRepository.delete(id);

    this.logger.log(`Deleted category "${category.name}" (${id})`);
    return { success: true, message: 'Category deleted successfully.' };
  }
}
