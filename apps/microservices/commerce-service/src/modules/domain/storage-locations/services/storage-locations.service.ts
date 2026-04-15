import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  ConflictException,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, asc, eq } from '@vritti/api-sdk/drizzle-orm';
import { storageLocations } from '@/db/schema';
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
    isActive: { column: storageLocations.isActive, type: 'boolean' },
    sortOrder: { column: storageLocations.sortOrder, type: 'number' },
    area: { column: storageLocations.area, type: 'string' },
  };

  constructor(private readonly storageLocationsRepository: StorageLocationsRepository) {}

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
      siblings.push({ id: row.id, name: row.name });
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
  async create(data: CreateStorageLocationDto): Promise<StorageLocationDto> {
    if (data.parentId) {
      await this.assertNoCircularReference(null, data.parentId);
    }

    const entity = await this.storageLocationsRepository.create({
      name: data.name,
      code: data.code,
      parentId: data.parentId ?? null,
      sortOrder: data.sortOrder ?? 1,
      area: data.area || null,
      managerId: data.managerId ?? null,
      address: data.address || null,
      isActive: data.isActive,
    });
    this.logger.log(`Created storage location: ${entity.name} (${entity.code})`);
    return StorageLocationDto.from(entity);
  }

  // Updates an storage location by ID
  async update(id: string, data: UpdateStorageLocationDto): Promise<SuccessResponseDto> {
    const existing = await this.storageLocationsRepository.findById(id);
    if (!existing) throw new NotFoundException('Storage location not found.');

    if (data.parentId) {
      await this.assertNoCircularReference(id, data.parentId);
    }

    await this.storageLocationsRepository.update(id, {
      ...data,
      parentId: data.parentId === undefined ? undefined : data.parentId || null,
      area: data.area !== undefined ? data.area || null : undefined,
      address: data.address !== undefined ? data.address || null : undefined,
    });
    this.logger.log(`Updated storage location: ${existing.name} (${id})`);
    return { success: true, message: `Storage location "${existing.name}" updated successfully.` };
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
