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
import { storageLocations, StorageLocationRoleValues } from '@/db/schema';
import type { CreateStorageLocationDto } from '@/modules/storage-locations/dto/request/create-storage-location.dto';
import type { UpdateStorageLocationDto } from '@/modules/storage-locations/dto/request/update-storage-location.dto';
import { StorageLocationDto } from '../dto/entity/storage-location.dto';
import type { StorageLocationCountDto } from '../dto/entity/storage-location-count.dto';
import type { StorageLocationTreeDto } from '../dto/entity/storage-location-tree.dto';
import { StorageLocationsRepository } from '../repositories/storage-locations.repository';

@Injectable()
export class StorageLocationsService {
  private readonly logger = new Logger(StorageLocationsService.name);
  private static readonly FIELD_MAP: FieldMap = {
    name: { column: storageLocations.name, type: 'string' },
    code: { column: storageLocations.code, type: 'string' },
    locationRole: { column: storageLocations.locationRole, type: 'string' },
    isActive: { column: storageLocations.isActive, type: 'boolean' },
    sortOrder: { column: storageLocations.sortOrder, type: 'number' },
    area: { column: storageLocations.area, type: 'string' },
  };

  constructor(private readonly storageLocationsRepository: StorageLocationsRepository) {}

  private static toPathLabel(code: string): string {
    const normalized = code
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return normalized || 'loc';
  }

  private static buildPath(parentPath: string | null, code: string): string {
    const label = StorageLocationsService.toPathLabel(code);
    return parentPath ? `${parentPath}.${label}` : label;
  }

  // Returns total storage location count (independent of tree search/filter)
  async count(): Promise<StorageLocationCountDto> {
    const count = await this.storageLocationsRepository.countAll();
    return { count };
  }

  // Returns a single storage location by ID with canDelete computed
  async findById(id: string): Promise<StorageLocationDto> {
    const entity = await this.storageLocationsRepository.findById(id);
    if (!entity) throw new NotFoundException('Storage location not found.');
    const refs = await this.storageLocationsRepository.countReferences(id);
    return StorageLocationDto.from(entity, refs.inventoryLevels === 0 && refs.childLocations === 0);
  }

  // Returns paginated child locations for a given parent ID
  async findChildrenForTable(
    parentId: string,
    state: TableViewState,
  ): Promise<{ result: StorageLocationDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, StorageLocationsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, StorageLocationsService.FIELD_MAP);
    const where = and(eq(storageLocations.parentId, parentId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, StorageLocationsService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.storageLocationsRepository.findAllAndCount({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(storageLocations.sortOrder), asc(storageLocations.name)],
      limit,
      offset,
    });

    const referencedIds = await this.storageLocationsRepository.findReferencedIds(rows.map((e) => e.id));
    const parentIdsWithChildren = await this.storageLocationsRepository.findParentIdsWithChildren(
      rows.map((e) => e.id),
    );

    return {
      result: rows.map((e) => StorageLocationDto.from(e, !referencedIds.has(e.id) && !parentIdsWithChildren.has(e.id))),
      count,
    };
  }

  // Returns storage locations as a TreeView-compatible hierarchy
  async findTree(search?: string): Promise<StorageLocationTreeDto[]> {
    const normalizedSearch = search?.trim();
    const rows = await this.storageLocationsRepository.findHierarchyRows(normalizedSearch);

    const childrenMap = new Map<string | null, StorageLocationTreeDto[]>();
    for (const row of rows) {
      const siblings = childrenMap.get(row.parentId) ?? [];
      siblings.push({ id: row.id, name: row.name, path: row.path });
      childrenMap.set(row.parentId, siblings);
    }

    const build = (parentId: string | null): StorageLocationTreeDto[] =>
      (childrenMap.get(parentId) ?? []).map((node) => {
        const children = build(node.id);
        return children.length > 0 ? { ...node, children } : node;
      });

    return build(null);
  }

  // Returns paginated location options for select dropdowns
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.storageLocationsRepository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
    });
  }

  // Reorders all siblings under a parent location using the provided final ID order
  async reorderSiblings(parentId: string | null, orderedIds: string[]): Promise<SuccessResponseDto> {
    if (orderedIds.length === 0) {
      throw new BadRequestException('orderedIds must contain at least one location ID.');
    }

    const uniqueOrderedIds = new Set(orderedIds);
    if (uniqueOrderedIds.size !== orderedIds.length) {
      throw new BadRequestException('orderedIds must not contain duplicates.');
    }

    const siblingIds = await this.storageLocationsRepository.findChildIdsByParent(parentId);
    if (siblingIds.length !== orderedIds.length) {
      throw new BadRequestException('orderedIds must include all siblings for the selected parent.');
    }

    const siblingSet = new Set(siblingIds);
    const hasOutOfScopeIds = orderedIds.some((id) => !siblingSet.has(id));
    if (hasOutOfScopeIds) {
      throw new BadRequestException('orderedIds contains invalid location IDs for the selected parent.');
    }

    await this.storageLocationsRepository.transaction(async (tx) => {
      for (let index = 0; index < orderedIds.length; index += 1) {
        await this.storageLocationsRepository.updateSortOrderInTx(tx, orderedIds[index], index + 1);
      }
    });

    this.logger.log(`Reordered ${orderedIds.length} storage locations under parent ${parentId ?? 'ROOT'}`);
    return { success: true, message: 'Storage locations reordered successfully.' };
  }

  // Creates a new storage location
  async create(data: CreateStorageLocationDto): Promise<CreateResponseDto<StorageLocationDto>> {
    if (data.parentId) {
      await this.assertNoCircularReference(null, data.parentId);
    }

    let parentPath: string | null = null;
    let parentRole: string | null = null;
    if (data.parentId) {
      const parent = await this.storageLocationsRepository.findById(data.parentId);
      if (!parent) throw new NotFoundException('Parent storage location not found.');
      parentPath = parent.path;
      parentRole = parent.locationRole;
    }

    if (parentRole !== null && parentRole !== StorageLocationRoleValues.ZONE) {
      throw new BadRequestException('Only ZONE locations can have child locations.');
    }

    const entity = await this.storageLocationsRepository.create({
      name: data.name,
      code: data.code,
      parentId: data.parentId ?? null,
      path: '__pending__',
      sortOrder: data.sortOrder ?? 1,
      area: data.area || null,
      managerId: data.managerId ?? null,
      address: data.address || null,
      locationRole: data.locationRole,
      isActive: data.isActive,
    });

    const path = StorageLocationsService.buildPath(parentPath, entity.code);
    await this.storageLocationsRepository.update(entity.id, { path });
    const created = await this.storageLocationsRepository.findById(entity.id);
    if (!created) throw new NotFoundException('Storage location not found.');

    this.logger.log(`Created storage location: ${entity.name} (${entity.code})`);
    return {
      success: true,
      message: `Storage location "${entity.name}" (${entity.code}) created successfully.`,
      data: StorageLocationDto.from(created),
    };
  }

  // Updates an storage location by ID
  async update(id: string, data: UpdateStorageLocationDto): Promise<SuccessResponseDto> {
    const existing = await this.storageLocationsRepository.findById(id);
    if (!existing) throw new NotFoundException('Storage location not found.');

    if (data.parentId !== undefined && data.parentId) {
      await this.assertNoCircularReference(id, data.parentId);
    }

    const nextParentId = data.parentId === undefined ? existing.parentId : data.parentId || null;
    const parentChanged = nextParentId !== existing.parentId;
    const nextCode = data.code === undefined ? existing.code : data.code;
    const codeChanged = nextCode !== existing.code;
    const nextLocationRole = data.locationRole ?? existing.locationRole;

    let nextParentPath: string | null = null;
    if (nextParentId) {
      const nextParent = await this.storageLocationsRepository.findById(nextParentId);
      if (!nextParent) throw new NotFoundException('Parent storage location not found.');
      if (nextParent.locationRole !== StorageLocationRoleValues.ZONE) {
        throw new BadRequestException('Only ZONE locations can have child locations.');
      }
      nextParentPath = nextParent.path;
    }

    if (nextLocationRole !== StorageLocationRoleValues.ZONE) {
      const refs = await this.storageLocationsRepository.countReferences(id);
      if (refs.childLocations > 0) {
        throw new BadRequestException('Only ZONE locations can have child locations.');
      }
    }

    const updated = await this.storageLocationsRepository.transaction(async (tx) => {
      const next = await this.storageLocationsRepository.update(id, {
        ...data,
        parentId: nextParentId,
        area: data.area !== undefined ? data.area || null : undefined,
        address: data.address !== undefined ? data.address || null : undefined,
      }, tx);

      if (parentChanged || codeChanged) {
        const nextPath = StorageLocationsService.buildPath(nextParentPath, nextCode);
        await this.storageLocationsRepository.rewriteSubtreePathInTx(tx, existing.path, nextPath);
      }
      return next;
    });

    this.logger.log(`Updated storage location: ${updated.name} (${id})`);
    return { success: true, message: `Storage location "${updated.name}" updated successfully.` };
  }

  // Deletes an storage location by ID; throws ConflictException if referenced
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.storageLocationsRepository.findById(id);
    if (!existing) throw new NotFoundException('Storage location not found.');
    const refs = await this.storageLocationsRepository.countReferences(id);
    const refLabels: [number, string][] = [
      [refs.inventoryLevels, 'inventory level'],
      [refs.childLocations, 'child location'],
    ];
    const parts = refLabels.filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}${n > 1 ? 's' : ''}`);
    if (parts.length > 0) {
      throw new ConflictException({
        label: 'Storage Location In Use',
        detail: `Cannot delete "${existing.name}" — it is referenced by ${parts.join(', ')}. Remove those references first.`,
      });
    }
    await this.storageLocationsRepository.delete(id);
    this.logger.log(`Deleted storage location: ${existing.name} (${id})`);
    return { success: true, message: `Storage location "${existing.name}" deleted successfully.` };
  }

  // Traverses the parent chain from ancestorId upward; throws if locationId appears in the chain
  private async assertNoCircularReference(locationId: string | null, proposedParentId: string): Promise<void> {
    let currentId: string | null = proposedParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (locationId !== null && currentId === locationId) {
        throw new BadRequestException(
          'Circular reference detected: a storage location cannot be set as a descendant of itself.',
        );
      }
      if (visited.has(currentId)) break; // guard against existing cycles in data
      visited.add(currentId);

      const node = await this.storageLocationsRepository.findById(currentId);
      currentId = node?.parentId ?? null;
    }
  }
}
