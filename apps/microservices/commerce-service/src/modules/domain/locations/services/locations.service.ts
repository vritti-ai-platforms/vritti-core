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
import { and, asc, eq, inArray, ne, or, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { type LocationRole, LocationRoleValues, locations } from '@/db/schema';
import type { CreateLocationDto } from '@/modules/locations/dto/request/create-location.dto';
import type { UpdateLocationDto } from '@/modules/locations/dto/request/update-location.dto';
import { LocationDto } from '../dto/entity/location.dto';
import type { LocationCountDto } from '../dto/entity/location-count.dto';
import type { LocationTreeDto } from '../dto/entity/location-tree.dto';
import { LocationsRepository } from '../repositories/locations.repository';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);
  private static readonly FIELD_MAP: FieldMap = {
    name: { column: locations.name, type: 'string' },
    code: { column: locations.code, type: 'string' },
    locationRole: { column: locations.locationRole, type: 'string' },
    isActive: { column: locations.isActive, type: 'boolean' },
    sortOrder: { column: locations.sortOrder, type: 'number' },
    area: { column: locations.area, type: 'string' },
  };

  constructor(private readonly locationsRepository: LocationsRepository) {}

  private static toPathLabel(code: string): string {
    const normalized = code
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return normalized || 'loc';
  }

  private static buildPath(parentPath: string | null, code: string): string {
    const label = LocationsService.toPathLabel(code);
    return parentPath ? `${parentPath}.${label}` : label;
  }

  // Returns total storage location count (independent of tree search/filter)
  async count(): Promise<LocationCountDto> {
    const count = await this.locationsRepository.countAll();
    return { count };
  }

  // Returns a single storage location by ID with canDelete computed
  async findById(id: string): Promise<LocationDto> {
    const entity = await this.locationsRepository.findById(id);
    if (!entity) throw new NotFoundException('Storage location not found.');
    const refs = await this.locationsRepository.countReferences(id);
    return LocationDto.from(entity, refs.inventoryLevels === 0 && refs.childLocations === 0);
  }

  // Returns paginated child locations for a given parent ID
  async findChildrenForTable(
    parentId: string,
    state: TableViewState,
  ): Promise<{ result: LocationDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, LocationsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, LocationsService.FIELD_MAP);
    const where = and(eq(locations.parentId, parentId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, LocationsService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.locationsRepository.findAllAndCount({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(locations.sortOrder), asc(locations.name)],
      limit,
      offset,
    });

    const referencedIds = await this.locationsRepository.findReferencedIds(rows.map((e) => e.id));
    const parentIdsWithChildren = await this.locationsRepository.findParentIdsWithChildren(rows.map((e) => e.id));

    return {
      result: rows.map((e) => LocationDto.from(e, !referencedIds.has(e.id) && !parentIdsWithChildren.has(e.id))),
      count,
    };
  }

  // Returns storage locations as a TreeView-compatible hierarchy
  async findTree(search?: string): Promise<LocationTreeDto[]> {
    const normalizedSearch = search?.trim();
    const rows = await this.locationsRepository.findHierarchyRows(normalizedSearch);

    const childrenMap = new Map<string | null, LocationTreeDto[]>();
    for (const row of rows) {
      const siblings = childrenMap.get(row.parentId) ?? [];
      siblings.push({ id: row.id, name: row.name, path: row.path });
      childrenMap.set(row.parentId, siblings);
    }

    const build = (parentId: string | null): LocationTreeDto[] =>
      (childrenMap.get(parentId) ?? []).map((node) => {
        const children = build(node.id);
        return children.length > 0 ? { ...node, children } : node;
      });

    return build(null);
  }

  private static readonly LOCATION_ROLE_LABELS: Record<LocationRole, string> = {
    STORAGE: 'Storage',
    RESERVED_STORAGE: 'Reserved Storage',
    ZONE: 'Zone',
  };

  // Display order for role groups in select dropdowns. Reserved bins surface first since they
  // are item-scoped and the most relevant choice when both roles are requested together.
  private static readonly LOCATION_ROLE_GROUP_ORDER: LocationRole[] = [
    LocationRoleValues.RESERVED_STORAGE,
    LocationRoleValues.STORAGE,
    LocationRoleValues.ZONE,
  ];

  // Returns paginated location options for select dropdowns.
  // locationRoles is a comma-separated whitelist against locations.location_role.
  // When inventoryItemId is provided AND RESERVED_STORAGE is requested, RESERVED_STORAGE bins are
  // further restricted to those linked to that item via inventory_item_locations.
  findForSelect(
    query: SelectOptionsQueryDto & { locationRoles?: string; inventoryItemId?: string },
  ): Promise<SelectQueryResult> {
    const roles = (query.locationRoles?.split(',') ?? [])
      .map((r) => r.trim())
      .filter((r): r is LocationRole => !!r);

    const conditions: SQL[] = [];
    if (roles.length > 0) {
      conditions.push(inArray(locations.locationRole, roles));
    }
    if (query.inventoryItemId && roles.includes(LocationRoleValues.RESERVED_STORAGE)) {
      // Non-RESERVED_STORAGE rows are unconstrained; RESERVED_STORAGE rows must be linked to the item.
      const reservedScope = or(
        ne(locations.locationRole, LocationRoleValues.RESERVED_STORAGE),
        inArray(
          locations.id,
          this.locationsRepository.allowedReservedLocationIdsSubquery(query.inventoryItemId),
        ),
      );
      if (reservedScope) conditions.push(reservedScope);
    }

    return this.locationsRepository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey || 'path',
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      groups:
        query.groupIdKey === 'locationRole' && roles.length > 0
          ? LocationsService.LOCATION_ROLE_GROUP_ORDER.filter((role) => roles.includes(role)).map((role) => ({
              id: role,
              name: LocationsService.LOCATION_ROLE_LABELS[role],
            }))
          : undefined,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      conditions: conditions.length > 0 ? conditions : undefined,
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

    const siblingIds = await this.locationsRepository.findChildIdsByParent(parentId);
    if (siblingIds.length !== orderedIds.length) {
      throw new BadRequestException('orderedIds must include all siblings for the selected parent.');
    }

    const siblingSet = new Set(siblingIds);
    const hasOutOfScopeIds = orderedIds.some((id) => !siblingSet.has(id));
    if (hasOutOfScopeIds) {
      throw new BadRequestException('orderedIds contains invalid location IDs for the selected parent.');
    }

    for (let index = 0; index < orderedIds.length; index += 1) {
      await this.locationsRepository.updateSortOrder(orderedIds[index], index + 1);
    }

    this.logger.log(`Reordered ${orderedIds.length} storage locations under parent ${parentId ?? 'ROOT'}`);
    return { success: true, message: 'Storage locations reordered successfully.' };
  }

  // Creates a new storage location
  async create(data: CreateLocationDto): Promise<CreateResponseDto<LocationDto>> {
    if (data.parentId) {
      await this.assertNoCircularReference(null, data.parentId);
    }

    let parentPath: string | null = null;
    let parentRole: string | null = null;
    if (data.parentId) {
      const parent = await this.locationsRepository.findById(data.parentId);
      if (!parent) throw new NotFoundException('Parent storage location not found.');
      parentPath = parent.path;
      parentRole = parent.locationRole;
    }

    if (parentRole !== null && parentRole !== LocationRoleValues.ZONE) {
      throw new BadRequestException('Only ZONE locations can have child locations.');
    }

    const entity = await this.locationsRepository.create({
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

    const path = LocationsService.buildPath(parentPath, entity.code);
    await this.locationsRepository.update(entity.id, { path });
    const created = await this.locationsRepository.findById(entity.id);
    if (!created) throw new NotFoundException('Storage location not found.');

    this.logger.log(`Created storage location: ${entity.name} (${entity.code})`);
    return {
      success: true,
      message: `Storage location "${entity.name}" (${entity.code}) created successfully.`,
      data: LocationDto.from(created),
    };
  }

  // Updates an storage location by ID
  async update(id: string, data: UpdateLocationDto): Promise<SuccessResponseDto> {
    const existing = await this.locationsRepository.findById(id);
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
      const nextParent = await this.locationsRepository.findById(nextParentId);
      if (!nextParent) throw new NotFoundException('Parent storage location not found.');
      if (nextParent.locationRole !== LocationRoleValues.ZONE) {
        throw new BadRequestException('Only ZONE locations can have child locations.');
      }
      nextParentPath = nextParent.path;
    }

    if (nextLocationRole !== LocationRoleValues.ZONE) {
      const refs = await this.locationsRepository.countReferences(id);
      if (refs.childLocations > 0) {
        throw new BadRequestException('Only ZONE locations can have child locations.');
      }
    }

    const updated = await this.locationsRepository.update(id, {
      ...data,
      parentId: nextParentId,
      area: data.area !== undefined ? data.area || null : undefined,
      address: data.address !== undefined ? data.address || null : undefined,
    });

    if (parentChanged || codeChanged) {
      const nextPath = LocationsService.buildPath(nextParentPath, nextCode);
      await this.locationsRepository.rewriteSubtreePath(existing.path, nextPath);
    }

    this.logger.log(`Updated storage location: ${updated.name} (${id})`);
    return { success: true, message: `Storage location "${updated.name}" updated successfully.` };
  }

  // Deletes an storage location by ID; throws ConflictException if referenced
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.locationsRepository.findById(id);
    if (!existing) throw new NotFoundException('Storage location not found.');
    const refs = await this.locationsRepository.countReferences(id);
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
    await this.locationsRepository.delete(id);
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

      const node = await this.locationsRepository.findById(currentId);
      currentId = node?.parentId ?? null;
    }
  }
}
