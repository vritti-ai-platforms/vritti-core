import { Injectable, Logger } from '@nestjs/common';
import { type CreateResponseDto, DataTableStateService, type SuccessResponseDto } from '@vritti/api-sdk';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateCategoryDto } from '../dto/request/create-category.dto';
import type { ReorderCategoriesDto } from '../dto/request/reorder-categories.dto';
import type { UpdateCategoryDto } from '../dto/request/update-category.dto';
import type { CategoryChildrenTableResponseDto } from '../dto/response/category-children-table-response.dto';
import type { CategoryCountResponseDto } from '../dto/response/category-count-response.dto';
import type { CategoryItemResponseDto } from '../dto/response/category-item-response.dto';
import type { CategoryItemTableResponseDto } from '../dto/response/category-item-table-response.dto';
import type { CategoryResponseDto } from '../dto/response/category-response.dto';
import type { CategoryTreeResponseDto } from '../dto/response/category-tree-response.dto';

@Injectable()
export class CategoriesGatewayService {
  private readonly logger = new Logger(CategoriesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns total category count
  async count(): Promise<CategoryCountResponseDto> {
    this.logger.log('categories.count');
    return this.nats.send('commerce', 'categories.count', {});
  }

  // Returns categories as tree hierarchy
  async findTree(search?: string): Promise<CategoryTreeResponseDto[]> {
    this.logger.log('categories.tree');
    return this.nats.send('commerce', 'categories.tree', { search });
  }

  // Returns paginated child categories for a given parent ID
  async findChildrenForTable(userId: string, parentId: string): Promise<CategoryChildrenTableResponseDto> {
    this.logger.log(`categories.childrenTable — parentId: ${parentId}`);
    const slug = `categories-children-${parentId}`;
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, slug);
    const { result, count } = await this.nats.send<{ result: CategoryResponseDto[]; count: number }>(
      'commerce',
      'categories.childrenTable',
      { parentId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Returns paginated inventory items for a leaf category (Redis-backed table state)
  async findItemsForTable(userId: string, categoryId: string): Promise<CategoryItemTableResponseDto> {
    this.logger.log(`categories.itemsTable — categoryId: ${categoryId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `category-${categoryId}-items`,
    );
    const { result, count } = await this.nats.send<{ result: CategoryItemResponseDto[]; count: number }>(
      'commerce',
      'categories.itemsTable',
      { categoryId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new category
  async create(dto: CreateCategoryDto): Promise<CreateResponseDto<CategoryResponseDto>> {
    this.logger.log(`categories.create — name: ${dto.name}`);
    return this.nats.send('commerce', 'categories.create', dto);
  }

  // Finds a category by ID
  async findById(id: string): Promise<CategoryResponseDto> {
    this.logger.log(`categories.findById — id: ${id}`);
    return this.nats.send('commerce', 'categories.findById', { id });
  }

  // Updates a category by ID
  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    this.logger.log(`categories.update — id: ${id}`);
    return this.nats.send('commerce', 'categories.update', { id, ...dto });
  }

  // Reorders sibling categories under a parent
  async reorder(dto: ReorderCategoriesDto): Promise<SuccessResponseDto> {
    this.logger.log('categories.reorder');
    return this.nats.send('commerce', 'categories.reorder', dto);
  }

  // Deletes a category by ID
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`categories.delete — id: ${id}`);
    return this.nats.send('commerce', 'categories.delete', { id });
  }
}
