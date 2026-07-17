import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  PrimaryDatabaseService,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc, eq } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import { type Category, type CategoryRole, CategoryRoleValues, categories } from '@/db/schema';
import type { CategoriesSelectQueryDto } from '@/modules/organization/categories/root/dto/request/categories-select-query.dto';
import type { CreateCategoryDto } from '@/modules/organization/categories/root/dto/request/create-category.dto';
import type { UpdateCategoryDto } from '@/modules/organization/categories/root/dto/request/update-category.dto';
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

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  // Throws unless the category is a leaf (role CATEGORY) — used by inventory-items / offerings to enforce leaf-only links
  async assertIsLeaf(categoryId: string): Promise<void> {
    const category = await this.requireById(categoryId);
    if (category.categoryRole !== CategoryRoleValues.CATEGORY) {
      throw new BadRequestException({
        label: 'Not a Leaf Category',
        detail: 'Items can only be linked to leaf categories. Choose a category (not a group) instead.',
      });
    }
  }

  // Returns paginated category options for the select component (role- and status-filtered; RLS scopes results)
  findForSelect(query: CategoriesSelectQueryDto): Promise<SelectQueryResult> {
    return this.categoriesRepository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey || 'path',
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
      conditions: [
        eq(categories.categoryRole, query.role ?? CategoryRoleValues.CATEGORY),
        eq(categories.isActive, (query.status ?? 'active') === 'active'),
      ],
    });
  }

  // Returns total category count
  async count(): Promise<CategoryCountDto> {
    const count = await this.categoriesRepository.countAll();
    return { count };
  }

  // Returns categories as a TreeView-compatible hierarchy. Single pass: the CTE returns rows in
  // pre-order so a row's parent is always already in the map by the time the row is processed.
  async findTree(search?: string): Promise<CategoryTreeDto[]> {
    const rows = await this.categoriesRepository.findHierarchyRows(search?.trim());

    const nodesById = new Map<string, CategoryTreeDto>();
    const roots: CategoryTreeDto[] = [];

    for (const row of rows) {
      const node: CategoryTreeDto = { id: row.id, name: row.name, categoryRole: row.categoryRole as CategoryRole };
      nodesById.set(row.id, node);

      if (row.parentId === null) {
        roots.push(node);
        continue;
      }

      const parent = nodesById.get(row.parentId);
      if (!parent) {
        roots.push(node);
        continue;
      }
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    }

    return roots;
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

    const { result: rows, count } = await this.categoriesRepository.findAllWithTaxClass({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(categories.sortOrder), asc(categories.name)],
      limit,
      offset,
    });

    const ids = rows.map((row) => row.id);
    const [referencedIds, parentIdsWithChildren] = await Promise.all([
      this.categoriesRepository.findReferencedIds(ids),
      this.categoriesRepository.findParentIdsWithChildren(ids),
    ]);

    return {
      result: rows.map((row) =>
        CategoryDto.from(row, !referencedIds.has(row.id) && !parentIdsWithChildren.has(row.id), row.defaultTaxClassName),
      ),
      count,
    };
  }

  // Creates a new category, computing its path label and full ltree path; blocks adding under a leaf category
  async create(data: CreateCategoryDto): Promise<CreateResponseDto<CategoryDto>> {
    const parent = data.parentId ? await this.loadParent(data.parentId) : null;
    if (parent) {
      await this.assertNoCircularReference(null, parent.id);
      this.assertParentAcceptsChildren(parent);
    }

    const role = data.categoryRole ?? CategoryRoleValues.CATEGORY;
    this.assertTaxClassForLeaf(role, data.defaultTaxClassId ?? null);

    const pathLabel = this.toPathLabel(data.name);
    const path = this.buildPath(parent?.path ?? null, pathLabel);

    const entity = await this.withDuplicateGuard(data.name, () =>
      this.categoriesRepository.create({
        name: data.name,
        parentId: parent?.id ?? null,
        categoryRole: role,
        pathLabel,
        path,
        sortOrder: data.sortOrder ?? 1,
        isActive: data.isActive ?? true,
        defaultTaxClassId: data.defaultTaxClassId ?? null,
      }),
    );

    this.logger.log(`Created category: ${entity.name} (${entity.id}) path=${path}`);
    return {
      success: true,
      message: `Category "${entity.name}" created successfully.`,
      data: CategoryDto.from(entity, true),
    };
  }

  // Finds a category by ID or throws NotFoundException
  async findById(id: string): Promise<CategoryDto> {
    const entity = await this.categoriesRepository.findByIdWithTaxClass(id);
    if (!entity) throw new NotFoundException('Category not found.');
    const refs = await this.categoriesRepository.countReferences(id);
    return CategoryDto.from(entity, this.isUnreferenced(refs), entity.defaultTaxClassName);
  }

  // Updates a category, recomputing path on rename/move and rewriting the affected subtree
  async update(id: string, data: Omit<UpdateCategoryDto, 'id'>): Promise<CategoryDto> {
    return this.database.runInTransaction(async () => {
      const existing = await this.requireById(id);

      const nextParentId = data.parentId === undefined ? existing.parentId : data.parentId || null;
      const nextName = data.name ?? existing.name;
      const parentChanged = nextParentId !== existing.parentId;
      const nameChanged = nextName !== existing.name;

      const nextParent = await this.resolveNextParent(existing, nextParentId, parentChanged);

      if (parentChanged && nextParent) {
        await this.assertNoCircularReference(id, nextParent.id);
        this.assertParentAcceptsChildren(nextParent);
      }

      if (data.categoryRole !== undefined) {
        await this.assertRoleChangeAllowed(existing, data.categoryRole);
      }

      const nextRole = data.categoryRole ?? existing.categoryRole;
      const nextTaxClassId =
        data.defaultTaxClassId === undefined ? existing.defaultTaxClassId : data.defaultTaxClassId || null;
      this.assertTaxClassForLeaf(nextRole, nextTaxClassId);

      const nextPathLabel = nameChanged ? this.toPathLabel(nextName) : existing.pathLabel;

      const updated = await this.withDuplicateGuard(nextName, () =>
        this.categoriesRepository.update(id, {
          ...data,
          parentId: data.parentId === undefined ? undefined : data.parentId || null,
          pathLabel: nameChanged ? nextPathLabel : undefined,
          defaultTaxClassId: data.defaultTaxClassId === undefined ? undefined : data.defaultTaxClassId || null,
        }),
      );

      if (parentChanged || nameChanged) {
        const nextPath = this.buildPath(nextParent?.path ?? null, nextPathLabel);
        await this.categoriesRepository.rewriteSubtreePath(existing.path, nextPath);
      }

      this.logger.log(`Updated category: ${updated.name} (${updated.id})`);
      const [refs, fresh] = await Promise.all([this.categoriesRepository.countReferences(id), this.requireById(id)]);
      return CategoryDto.from(fresh, this.isUnreferenced(refs));
    });
  }

  // Reorders all siblings under a parent category using the provided final ID order
  async reorderSiblings(parentId: string | null, orderedIds: string[]): Promise<SuccessResponseDto> {
    if (orderedIds.length === 0) {
      throw new BadRequestException('orderedIds must contain at least one category ID.');
    }

    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      throw new BadRequestException('orderedIds must not contain duplicates.');
    }

    const siblingIds = await this.categoriesRepository.findChildIdsByParent(parentId);
    if (siblingIds.length !== orderedIds.length) {
      throw new BadRequestException('orderedIds must include all siblings for the selected parent.');
    }

    const siblingSet = new Set(siblingIds);
    if (orderedIds.some((id) => !siblingSet.has(id))) {
      throw new BadRequestException('orderedIds contains invalid category IDs for the selected parent.');
    }

    await this.database.runInTransaction(async () => {
      await Promise.all(orderedIds.map((id, index) => this.categoriesRepository.updateSortOrder(id, index + 1)));
    });

    this.logger.log(`Reordered ${orderedIds.length} categories under parent ${parentId ?? 'ROOT'}`);
    return { success: true, message: 'Categories reordered successfully.' };
  }

  // Deletes a category by ID; refuses if anything still references it
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.requireById(id);
    const refs = await this.categoriesRepository.countReferences(id);

    const parts = _.compact([
      refs.items > 0 && `${refs.items} item${refs.items > 1 ? 's' : ''}`,
      refs.inventoryItems > 0 && `${refs.inventoryItems} inventory item${refs.inventoryItems > 1 ? 's' : ''}`,
      refs.childCategories > 0 && `${refs.childCategories} child categor${refs.childCategories > 1 ? 'ies' : 'y'}`,
    ]);
    if (parts.length > 0) {
      throw new ConflictException({
        label: 'Category In Use',
        detail: `Cannot delete "${existing.name}" — it is referenced by ${parts.join(', ')}. Remove those references first.`,
      });
    }

    await this.categoriesRepository.delete(id);
    this.logger.log(`Deleted category: ${existing.name} (${id})`);
    return { success: true, message: `Category "${existing.name}" deleted successfully.` };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  // Slugifies a category name into a single ltree-safe segment (lowercase, underscores)
  private toPathLabel(name: string): string {
    return _.snakeCase(name) || 'cat';
  }

  // Joins a parent path and a label into the child's full ltree path
  private buildPath(parentPath: string | null, label: string): string {
    return parentPath ? `${parentPath}.${label}` : label;
  }

  // Loads a category by ID, throwing if not found
  private async requireById(id: string): Promise<Category> {
    const entity = await this.categoriesRepository.findById(id);
    if (!entity) throw new NotFoundException('Category not found.');
    return entity;
  }

  // Loads a parent category, throwing a parent-specific NotFoundException if missing
  private async loadParent(parentId: string): Promise<Category> {
    const parent = await this.categoriesRepository.findById(parentId);
    if (!parent) throw new NotFoundException('Parent category not found.');
    return parent;
  }

  // Returns the parent context to use after an update (next, current, or none)
  private async resolveNextParent(
    existing: Category,
    nextParentId: string | null,
    parentChanged: boolean,
  ): Promise<Category | null> {
    if (parentChanged) {
      return nextParentId ? this.loadParent(nextParentId) : null;
    }
    return existing.parentId ? this.loadParent(existing.parentId) : null;
  }

  // Fail-closed: a leaf CATEGORY must carry a default tax class; GROUP categories skip the check
  private assertTaxClassForLeaf(role: CategoryRole, taxClassId: string | null): void {
    if (role === CategoryRoleValues.CATEGORY && !taxClassId) {
      throw new BadRequestException({
        label: 'Tax Class Required',
        detail: 'A tax class is required for item categories.',
        errors: [{ field: 'defaultTaxClassId', message: 'Select a tax class.' }],
      });
    }
  }

  // Blocks adding a child unless the parent is a GROUP (a leaf CATEGORY cannot hold sub-categories)
  private assertParentAcceptsChildren(parent: Category): void {
    if (parent.categoryRole !== CategoryRoleValues.GROUP) {
      throw new BadRequestException({
        label: 'Not a Group',
        detail: `Cannot add a sub-category under "${parent.name}" — it is a leaf category. Change its role to Group first.`,
      });
    }
  }

  // Guards a role change: a GROUP can only become a leaf with no children; a leaf can only become a GROUP with no items
  private async assertRoleChangeAllowed(category: Category, nextRole: CategoryRole): Promise<void> {
    if (nextRole === category.categoryRole) return;
    if (nextRole === CategoryRoleValues.CATEGORY) {
      const childCount = await this.categoriesRepository.countChildren(category.id);
      if (childCount > 0) {
        throw new BadRequestException({
          label: 'Group Has Sub-categories',
          detail: `Cannot turn "${category.name}" into a leaf category — it still has ${childCount} sub-categor${childCount > 1 ? 'ies' : 'y'}. Move or delete them first.`,
        });
      }
    } else {
      const itemCount = await this.categoriesRepository.countItemsForCategory(category.id);
      if (itemCount > 0) {
        throw new BadRequestException({
          label: 'Category Has Items',
          detail: `Cannot turn "${category.name}" into a group — ${itemCount} item(s) are linked to it. Reassign those items first.`,
        });
      }
    }
  }

  // Walks the parent chain upward; throws if categoryId appears in the chain (cycle / self-descendant)
  private async assertNoCircularReference(categoryId: string | null, proposedParentId: string): Promise<void> {
    const walk = async (currentId: string, visited: ReadonlySet<string>): Promise<void> => {
      if (categoryId !== null && currentId === categoryId) {
        throw new BadRequestException(
          'Circular reference detected: a category cannot be set as a descendant of itself.',
        );
      }
      if (visited.has(currentId)) return;
      const node = await this.categoriesRepository.findById(currentId);
      if (!node?.parentId) return;
      await walk(node.parentId, new Set([...visited, currentId]));
    };
    await walk(proposedParentId, new Set());
  }

  // Wraps a write that may collide on (parent_id, path_label); translates 23505 → ConflictException
  private async withDuplicateGuard<T>(name: string, write: () => Promise<T>): Promise<T> {
    try {
      return await write();
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          label: 'Duplicate Sibling',
          detail: `A sibling category with the name "${name}" already exists. Pick a different name.`,
        });
      }
      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return _.get(error, 'code') === '23505';
  }

  private isUnreferenced(refs: { items: number; inventoryItems: number; childCategories: number }): boolean {
    return _.every(refs, (n) => n === 0);
  }
}
