import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  ConflictException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, asc, eq } from '@vritti/api-sdk/drizzle-orm';
import { categories } from '@/db/schema';
import type { CreateCategoryDto } from '@/modules/categories/dto/request/create-category.dto';
import type { UpdateCategoryDto } from '@/modules/categories/dto/request/update-category.dto';
import { CategoryDto } from '../dto/entity/category.dto';
import type { CategoryCountDto } from '../dto/entity/category-count.dto';
import type { CategoryTreeDto } from '../dto/entity/category-tree.dto';
import { CategoriesRepository } from '../repositories/categories.repository';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);
  private static readonly FIELD_MAP: FieldMap = {
    name: { column: categories.name, type: 'string' },
    isActive: { column: categories.isActive, type: 'boolean' },
    sortOrder: { column: categories.sortOrder, type: 'number' },
  };

  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  // Returns paginated category options for the select component (RLS scopes results)
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.categoriesRepository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      groupId: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
    });
  }

  // Returns total category count
  async count(): Promise<CategoryCountDto> {
    const count = await this.categoriesRepository.countAll();
    return { count };
  }

  // Returns categories as a TreeView-compatible hierarchy
  async findTree(search?: string): Promise<CategoryTreeDto[]> {
    const normalizedSearch = search?.trim();
    const rows = await this.categoriesRepository.findHierarchyRows(normalizedSearch);

    const childrenMap = new Map<string | null, CategoryTreeDto[]>();
    for (const row of rows) {
      const siblings = childrenMap.get(row.parentId) ?? [];
      siblings.push({ id: row.id, name: row.name });
      childrenMap.set(row.parentId, siblings);
    }

    const build = (parentId: string | null): CategoryTreeDto[] =>
      (childrenMap.get(parentId) ?? []).map((node) => {
        const children = build(node.id);
        return children.length > 0 ? { ...node, children } : node;
      });

    return build(null);
  }

  // Returns paginated child categories for a given parent ID
  async findChildrenForTable(
    parentId: string,
    state: TableViewState,
  ): Promise<{ result: CategoryDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, CategoriesService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, CategoriesService.FIELD_MAP);
    const where = and(eq(categories.parentId, parentId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, CategoriesService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.categoriesRepository.findAllAndCount({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(categories.sortOrder), asc(categories.name)],
      limit,
      offset,
    });

    const referencedIds = await this.categoriesRepository.findReferencedIds(rows.map((e) => e.id));
    const parentIdsWithChildren = await this.categoriesRepository.findParentIdsWithChildren(rows.map((e) => e.id));

    return {
      result: rows.map((e) => CategoryDto.from(e, !referencedIds.has(e.id) && !parentIdsWithChildren.has(e.id))),
      count,
    };
  }

  // Creates a new category and returns the entity DTO
  async create(data: CreateCategoryDto): Promise<CreateResponseDto<CategoryDto>> {
    if (data.parentId) {
      await this.assertNoCircularReference(null, data.parentId);
    }

    const entity = await this.categoriesRepository.create({
      name: data.name,
      parentId: data.parentId ?? null,
      sortOrder: data.sortOrder ?? 1,
      isActive: data.isActive ?? true,
    });

    this.logger.log(`Created category: ${entity.name} (${entity.id})`);
    return {
      success: true,
      message: `Category "${entity.name}" created successfully.`,
      data: CategoryDto.from(entity, true),
    };
  }

  // Finds a category by ID or throws NotFoundException
  async findById(id: string): Promise<CategoryDto> {
    const entity = await this.categoriesRepository.findById(id);
    if (!entity) throw new NotFoundException('Category not found.');

    const refs = await this.categoriesRepository.countReferences(id);
    return CategoryDto.from(entity, refs.items === 0 && refs.inventoryItems === 0 && refs.childCategories === 0);
  }

  // Updates a category and returns the updated entity DTO
  async update(id: string, data: UpdateCategoryDto): Promise<CategoryDto> {
    const existing = await this.categoriesRepository.findById(id);
    if (!existing) throw new NotFoundException('Category not found.');

    if (data.parentId) {
      await this.assertNoCircularReference(id, data.parentId);
    }

    const entity = await this.categoriesRepository.update(id, {
      ...data,
      parentId: data.parentId === undefined ? undefined : data.parentId || null,
    });

    this.logger.log(`Updated category: ${entity.name} (${entity.id})`);
    const refs = await this.categoriesRepository.countReferences(id);
    return CategoryDto.from(entity, refs.items === 0 && refs.inventoryItems === 0 && refs.childCategories === 0);
  }

  // Reorders all siblings under a parent category using the provided final ID order
  async reorderSiblings(parentId: string | null, orderedIds: string[]): Promise<SuccessResponseDto> {
    if (orderedIds.length === 0) {
      throw new BadRequestException('orderedIds must contain at least one category ID.');
    }

    const uniqueOrderedIds = new Set(orderedIds);
    if (uniqueOrderedIds.size !== orderedIds.length) {
      throw new BadRequestException('orderedIds must not contain duplicates.');
    }

    const siblingIds = await this.categoriesRepository.findChildIdsByParent(parentId);
    if (siblingIds.length !== orderedIds.length) {
      throw new BadRequestException('orderedIds must include all siblings for the selected parent.');
    }

    const siblingSet = new Set(siblingIds);
    const hasOutOfScopeIds = orderedIds.some((id) => !siblingSet.has(id));
    if (hasOutOfScopeIds) {
      throw new BadRequestException('orderedIds contains invalid category IDs for the selected parent.');
    }

    await this.categoriesRepository.transaction(async (tx) => {
      for (let index = 0; index < orderedIds.length; index += 1) {
        await this.categoriesRepository.updateSortOrderInTx(tx, orderedIds[index], index + 1);
      }
    });

    this.logger.log(`Reordered ${orderedIds.length} categories under parent ${parentId ?? 'ROOT'}`);
    return { success: true, message: 'Categories reordered successfully.' };
  }

  // Traverses the parent chain from ancestorId upward; throws if categoryId appears in the chain
  private async assertNoCircularReference(categoryId: string | null, proposedParentId: string): Promise<void> {
    let currentId: string | null = proposedParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (categoryId !== null && currentId === categoryId) {
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

    const refs = await this.categoriesRepository.countReferences(id);
    const refLabels: [number, string][] = [
      [refs.items, 'item'],
      [refs.inventoryItems, 'inventory item'],
      [refs.childCategories, 'child category'],
    ];
    const parts = refLabels.filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}${n > 1 ? 's' : ''}`);
    if (parts.length > 0) {
      throw new ConflictException({
        label: 'Category In Use',
        detail: `Cannot delete "${existing.name}" — it is referenced by ${parts.join(', ')}. Remove those references first.`,
      });
    }

    await this.categoriesRepository.delete(id);
    this.logger.log(`Deleted category: ${id}`);
    return { success: true, message: 'Category deleted successfully.' };
  }
}
