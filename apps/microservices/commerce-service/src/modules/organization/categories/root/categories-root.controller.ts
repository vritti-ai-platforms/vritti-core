import type { CategoryDto } from '@domain/categories/dto/entity/category.dto';
import type { CategoryCountDto } from '@domain/categories/dto/entity/category-count.dto';
import type { CategoryTreeDto } from '@domain/categories/dto/entity/category-tree.dto';
import { CategoriesService } from '@domain/categories/services/categories.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk/database';
import type { CreateCategoryDto } from '../dto/request/create-category.dto';
import type { ReorderCategoriesDto } from '../dto/request/reorder-categories.dto';
import type { UpdateCategoryDto } from '../dto/request/update-category.dto';

@Controller()
export class CategoriesRootController {
  private readonly logger = new Logger(CategoriesRootController.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  // Returns total categories count
  @MessagePattern({ cmd: 'org.categories.count' })
  async count(): Promise<CategoryCountDto> {
    this.logger.log('categories.count');
    return this.categoriesService.count();
  }

  // Returns categories as a tree hierarchy for TreeView
  @MessagePattern({ cmd: 'org.categories.tree' })
  async tree(@Payload() data?: { search?: string }): Promise<CategoryTreeDto[]> {
    this.logger.log('categories.tree');
    return this.categoriesService.findTree(data?.search);
  }

  // Returns paginated child categories for a given parent ID
  @MessagePattern({ cmd: 'org.categories.childrenTable' })
  async childrenTable(
    @Payload() data: { parentId: string } & TableViewState,
  ): Promise<{ result: CategoryDto[]; count: number }> {
    this.logger.log(`categories.childrenTable — parentId: ${data.parentId}`);
    return this.categoriesService.findChildrenForTable(data.parentId, data);
  }

  // Creates a new category (org_id/bu_id auto-filled by DB defaults from session vars)
  @MessagePattern({ cmd: 'org.categories.create' })
  async create(@Payload() dto: CreateCategoryDto): Promise<CreateResponseDto<CategoryDto>> {
    this.logger.log(`categories.create — name: ${dto.name}`);
    return this.categoriesService.create(dto);
  }

  // Finds a category by ID (RLS scopes visibility)
  @MessagePattern({ cmd: 'org.categories.findById' })
  async findById(@Payload() data: { id: string }): Promise<CategoryDto> {
    this.logger.log(`categories.findById — id: ${data.id}`);
    return this.categoriesService.findById(data.id);
  }

  // Updates a category by ID
  @MessagePattern({ cmd: 'org.categories.update' })
  async update(@Payload() data: { id: string } & UpdateCategoryDto): Promise<CategoryDto> {
    const { id, ...updateData } = data;
    this.logger.log(`categories.update — id: ${id}`);
    return this.categoriesService.update(id, updateData);
  }

  // Reorders siblings under a parent category
  @MessagePattern({ cmd: 'org.categories.reorder' })
  async reorder(@Payload() data: ReorderCategoriesDto): Promise<SuccessResponseDto> {
    this.logger.log('categories.reorder');
    return this.categoriesService.reorderSiblings(data.parentId ?? null, data.orderedIds);
  }

  // Deletes a category by ID
  @MessagePattern({ cmd: 'org.categories.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`categories.delete — id: ${data.id}`);
    return this.categoriesService.delete(data.id);
  }
}
