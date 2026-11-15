import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import Decimal from '@vritti/api-sdk/decimal';
import { and, asc, eq, inArray, ne, notInArray, or, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult, selectPageOptions } from '@vritti/api-sdk/select';
import { type LocationRole, LocationRoleValues, locations } from '@/db/schema';
import { LocationDto } from '../dto/entity/location.dto';
import type { LocationCountDto } from '../dto/entity/location-count.dto';
import type { LocationFillDto } from '../dto/entity/location-fill.dto';
import type {
  FillQuantRow,
  FillStorageTypeLimit,
  FillUomFactorSource,
  FillUsageRule,
  LocationFillInputs,
} from '../dto/entity/location-fill-inputs.dto';
import type { LocationTreeDto } from '../dto/entity/location-tree.dto';
import type {
  LocationStorageTypeChange,
  LocationUpdatePlan,
  StoredItemPlacementDto,
} from '../dto/entity/location-update-plan.dto';
import type { CreateLocationDto } from '../dto/request/create-location.dto';
import type { UpdateLocationDto } from '../dto/request/update-location.dto';
import { LocationsDomainRepository, type SubtreeRow } from '../repositories/locations.repository';

const CAPACITY_DP = 2;
const MEASURE_DP = 3;

interface MeasureTotals {
  capacity: Decimal;
  weight: Decimal;
  volume: Decimal;
  unconfiguredItemIds: Set<string>;
}

@Injectable()
export class LocationsDomainService {
  private readonly logger = new Logger(LocationsDomainService.name);
  private static readonly FIELD_MAP: FieldMap = {
    name: { column: locations.name, type: 'string' },
    code: { column: locations.code, type: 'string' },
    locationRole: { column: locations.locationRole, type: 'string' },
    isActive: { column: locations.isActive, type: 'boolean' },
    sortOrder: { column: locations.sortOrder, type: 'number' },
    area: { column: locations.area, type: 'string' },
  };

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly locationsRepository: LocationsDomainRepository,
  ) {}

  // Creates a new storage location
  async create(data: CreateLocationDto): Promise<CreateResponseDto<LocationDto>> {
    if (data.parentId) {
      await this.assertNoCircularReference(null, data.parentId);
    }

    let parentPath: string | null = null;
    let parentRole: string | null = null;
    let parentStorageTypeId: string | null = null;
    if (data.parentId) {
      const parent = await this.locationsRepository.findById(data.parentId);
      if (!parent) throw new NotFoundException('Parent storage location not found.');
      parentPath = parent.path;
      parentRole = parent.locationRole;
      parentStorageTypeId = parent.storageTypeId;
    }

    const ownStorageTypeId = data.inheritStorageType ? null : (data.storageTypeId ?? null);
    const storageTypeId = ownStorageTypeId ?? parentStorageTypeId;
    if (data.locationRole !== LocationRoleValues.ZONE && !storageTypeId) {
      throw LocationsDomainService.storageTypeRequired([data.name]);
    }

    if (parentRole !== null && parentRole !== LocationRoleValues.ZONE) {
      throw new BadRequestException({
        label: 'Invalid Parent',
        detail: 'Only Zone locations can contain other locations. Pick a Zone as the parent.',
        errors: [{ field: 'parentId', message: 'Parent must be a Zone' }],
      });
    }

    const created = await this.database.runInTransaction(async () => {
      const entity = await this.locationsRepository.create({
        name: data.name,
        code: data.code,
        parentId: data.parentId ?? null,
        path: '__pending__',
        sortOrder: data.sortOrder ?? 1,
        area: data.area ?? null,
        managerId: data.managerId ?? null,
        locationRole: data.locationRole,
        storageTypeId,
        isStorageTypeOverridden: ownStorageTypeId !== null,
        isActive: data.isActive,
      });

      const path = LocationsDomainService.buildPath(parentPath, entity.code);
      await this.locationsRepository.update(entity.id, { path });
      const fresh = await this.locationsRepository.findDetail(entity.id);
      if (!fresh) throw new NotFoundException('Storage location not found.');
      return { entity, fresh };
    });

    const { entity, fresh: createdRow } = created;
    this.logger.log(`Created storage location: ${entity.name} (${entity.code})`);
    return {
      success: true,
      message: `Storage location "${entity.name}" (${entity.code}) created successfully.`,
      data: LocationDto.from(createdRow),
    };
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

    await this.database.runInTransaction(async () => {
      for (let index = 0; index < orderedIds.length; index += 1) {
        await this.locationsRepository.updateSortOrder(orderedIds[index], index + 1);
      }
    });

    this.logger.log(`Reordered ${orderedIds.length} storage locations under parent ${parentId ?? 'ROOT'}`);
    return { success: true, message: 'Storage locations reordered successfully.' };
  }

  // Writes a planned update: the row, its subtree's paths when it moved or was recoded, and inherited storage types
  async applyUpdate(plan: LocationUpdatePlan): Promise<SuccessResponseDto> {
    const { location } = plan;
    const descendantChanges = plan.storageTypeChanges.filter((change) => change.id !== location.id);

    const updated = await this.database.runInTransaction(async () => {
      const row = await this.locationsRepository.update(location.id, plan.values);
      if (plan.nextPath) {
        await this.locationsRepository.rewriteSubtreePath(location.path, plan.nextPath);
      }
      for (const [storageTypeId, ids] of LocationsDomainService.groupByStorageType(descendantChanges)) {
        await this.locationsRepository.setStorageType(ids, storageTypeId);
      }
      return row;
    });

    this.logger.log(
      `Updated storage location: ${updated.name} (${location.id}), ${descendantChanges.length} descendant storage types changed`,
    );
    return { success: true, message: `Storage location "${updated.name}" updated successfully.` };
  }

  // Returns a single storage location by ID with canDelete computed
  async findById(id: string): Promise<LocationDto> {
    const entity = await this.locationsRepository.findDetail(id);
    if (!entity) throw new NotFoundException('Storage location not found.');
    const refs = await this.locationsRepository.countReferences(id);
    return LocationDto.from(entity, refs.inventoryLevels === 0 && refs.childLocations === 0);
  }

  // Returns paginated child locations for a given parent ID
  async findChildrenForTable(parentId: string, state: TableState): Promise<{ result: LocationDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, LocationsDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, LocationsDomainService.FIELD_MAP);
    const where = and(eq(locations.parentId, parentId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, LocationsDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.locationsRepository.findForTable({
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

  // Returns total storage location count (independent of tree search/filter)
  async count(): Promise<LocationCountDto> {
    const count = await this.locationsRepository.countAll();
    return { count };
  }

  // Returns storage locations as a TreeView-compatible hierarchy
  async findTree(search?: string): Promise<LocationTreeDto[]> {
    const normalizedSearch = search?.trim();
    const rows = await this.locationsRepository.findHierarchyRows(normalizedSearch);

    const childrenMap = new Map<string | null, LocationTreeDto[]>();
    for (const row of rows) {
      const siblings = childrenMap.get(row.parentId) ?? [];
      siblings.push({
        id: row.id,
        name: row.name,
        locationRole: row.locationRole,
        storageTypeId: row.storageTypeId,
        storageTypeName: row.storageTypeName,
        isStorageTypeOverridden: row.isStorageTypeOverridden,
        inheritedFromLocationName: null,
        fill: null,
      });
      childrenMap.set(row.parentId, siblings);
    }

    // The nearest overridden ancestor is the location an inheriting node takes its type from
    const build = (parentId: string | null, typeSource: string | null): LocationTreeDto[] =>
      (childrenMap.get(parentId) ?? []).map((node) => {
        const inherits = !node.isStorageTypeOverridden && node.storageTypeId !== null;
        const withSource = { ...node, inheritedFromLocationName: inherits ? typeSource : null };
        const children = build(node.id, node.isStorageTypeOverridden ? node.name : typeSource);
        return children.length > 0 ? { ...withSource, children } : withSource;
      });

    return build(null, null);
  }

  // Returns paginated location options for select dropdowns. locationRoles is a comma-separated whitelist against
  // locations.location_role.
  findForSelect(
    query: SelectOptionsQueryDto & {
      locationRoles?: string;
      inventoryItemId?: string;
      excludeUsedOnGoodsReceiptItemId?: string;
      goodsReceiptLotId?: string;
      atSiteId?: string;
    },
  ): Promise<SelectQueryResult> {
    const roles = (query.locationRoles?.split(',') ?? []).map((r) => r.trim()).filter((r): r is LocationRole => !!r);

    const conditions: SQL[] = [];
    if (roles.length > 0) {
      conditions.push(inArray(locations.locationRole, roles));
    }
    // One site's locations, for a legal entity picking them for one of its sites
    if (query.atSiteId) {
      conditions.push(eq(locations.siteId, query.atSiteId));
    }
    if (query.excludeUsedOnGoodsReceiptItemId) {
      conditions.push(
        notInArray(
          locations.id,
          this.locationsRepository.usedLocationIdsOnGoodsReceiptItemSubquery(
            query.excludeUsedOnGoodsReceiptItemId,
            query.goodsReceiptLotId ?? null,
          ),
        ),
      );
    }
    if (query.inventoryItemId && roles.includes(LocationRoleValues.RESERVED_STORAGE)) {
      // Non-RESERVED_STORAGE rows are unconstrained; RESERVED_STORAGE rows must be linked to the item.
      const reservedScope = or(
        ne(locations.locationRole, LocationRoleValues.RESERVED_STORAGE),
        inArray(locations.id, this.locationsRepository.allowedReservedLocationIdsSubquery(query.inventoryItemId)),
      );
      if (reservedScope) conditions.push(reservedScope);
    }

    return this.locationsRepository.findForSelect({
      ...selectPageOptions(query),
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey || 'path',
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      groups:
        query.groupIdKey === 'locationRole' && roles.length > 0
          ? LocationsDomainService.LOCATION_ROLE_GROUP_ORDER.filter((role) => roles.includes(role)).map((role) => ({
              id: role,
              name: LocationsDomainService.LOCATION_ROLE_LABELS[role],
            }))
          : undefined,
      conditions: conditions.length > 0 ? conditions : undefined,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
    });
  }

  // Rejects a picked location that does not exist or belongs to another site
  async assertAtSite(siteId: string, locationId: string, field: string): Promise<void> {
    const location = await this.locationsRepository.findById(locationId);
    if (location?.siteId === siteId) return;
    throw new BadRequestException({
      label: 'Location Not at Site',
      detail: location
        ? `"${location.name}" is a location of another site. Pick one of this site's locations.`
        : "The selected location does not exist. Pick one of this site's locations.",
      errors: [{ field, message: location ? 'Not at this site' : 'Location not found' }],
    });
  }

  // Validates an update and works out the row values, the new path and every storage type it changes in the subtree;
  // a zone's type flows down to descendants that do not override it, stopping at those that do
  async planUpdate(id: string, data: UpdateLocationDto): Promise<LocationUpdatePlan> {
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
    let parentStorageTypeId: string | null = null;
    if (nextParentId) {
      const nextParent = await this.locationsRepository.findById(nextParentId);
      if (!nextParent) throw new NotFoundException('Parent storage location not found.');
      if (nextParent.locationRole !== LocationRoleValues.ZONE) {
        throw new BadRequestException('Only ZONE locations can have child locations.');
      }
      nextParentPath = nextParent.path;
      parentStorageTypeId = nextParent.storageTypeId;
    }

    if (nextLocationRole !== LocationRoleValues.ZONE) {
      const refs = await this.locationsRepository.countReferences(id);
      if (refs.childLocations > 0) {
        throw new BadRequestException('Only ZONE locations can have child locations.');
      }
    }

    // Picking the type it already has keeps the location's override state, so a form resending it changes nothing
    let isOverridden = existing.isStorageTypeOverridden;
    let ownStorageTypeId = existing.isStorageTypeOverridden ? existing.storageTypeId : null;
    let assignedStorageTypeId: string | null = null;
    if (data.inheritStorageType || data.storageTypeId === null) {
      isOverridden = false;
      ownStorageTypeId = null;
    } else if (data.storageTypeId && data.storageTypeId !== existing.storageTypeId) {
      isOverridden = true;
      ownStorageTypeId = data.storageTypeId;
      assignedStorageTypeId = data.storageTypeId;
    }
    const storageTypeId = isOverridden ? ownStorageTypeId : parentStorageTypeId;

    if (nextLocationRole !== LocationRoleValues.ZONE && !storageTypeId) {
      throw LocationsDomainService.storageTypeRequired([data.name ?? existing.name]);
    }

    const subtree = await this.locationsRepository.findSubtree(existing.siteId, existing.path);
    const storageTypeChanges = LocationsDomainService.inheritStorageTypes(subtree, id, storageTypeId);
    const untyped = storageTypeChanges.filter(
      (change) => change.id !== id && change.storageTypeId === null && change.locationRole !== LocationRoleValues.ZONE,
    );
    if (untyped.length > 0) throw LocationsDomainService.storageTypeRequired(untyped.map((change) => change.name));

    const { inheritStorageType: _inherit, storageTypeId: _requested, ...fields } = data;
    return {
      location: existing,
      values: { ...fields, parentId: nextParentId, storageTypeId, isStorageTypeOverridden: isOverridden },
      nextPath: parentChanged || codeChanged ? LocationsDomainService.buildPath(nextParentPath, nextCode) : null,
      assignedStorageTypeId,
      storageTypeChanges: storageTypeChanges.map(({ id: changeId, name, storageTypeId: next }) => ({
        id: changeId,
        name,
        storageTypeId: next,
      })),
    };
  }

  // Returns the items stored in locations whose storage type the plan changes, paired with the new type
  async findStoredItemPlacements(plan: LocationUpdatePlan): Promise<StoredItemPlacementDto[]> {
    const nextTypeById = new Map(plan.storageTypeChanges.map((change) => [change.id, change.storageTypeId]));
    const rows = await this.locationsRepository.findStoredItems([...nextTypeById.keys()]);
    return rows.flatMap((row) => {
      const storageTypeId = nextTypeById.get(row.locationId);
      if (!storageTypeId) return [];
      return [
        {
          locationName: row.locationName,
          inventoryItemId: row.inventoryItemId,
          inventoryItemName: row.inventoryItemName,
          storageTypeId,
        },
      ];
    });
  }

  // Loads the members (a location itself, or a zone's storage locations) and their quants for the fill read
  async findFillInputs(locationIds: string[]): Promise<LocationFillInputs> {
    const members = await this.locationsRepository.findFillMembers(locationIds);
    const quants = await this.locationsRepository.findFillQuants([...new Set(members.map((m) => m.locationId))]);
    const packUomPairs = new Map<string, { inventoryItemId: string; uomId: string }>();
    for (const quant of quants) {
      if (quant.packUomId) {
        packUomPairs.set(`${quant.inventoryItemId}:${quant.packUomId}`, {
          inventoryItemId: quant.inventoryItemId,
          uomId: quant.packUomId,
        });
      }
    }
    return {
      locationIds,
      members,
      quants,
      storageTypeIds: [...new Set(members.flatMap((m) => (m.storageTypeId ? [m.storageTypeId] : [])))],
      inventoryItemIds: [...new Set(quants.map((q) => q.inventoryItemId))],
      packUomPairs: [...packUomPairs.values()],
    };
  }

  // Computes each location's fill: a storage location from its own quants; a zone as the average capacity of its
  // storage locations and the sums of their weight and volume against their summed maxima
  computeFill(
    inputs: LocationFillInputs,
    limits: FillStorageTypeLimit[],
    rules: FillUsageRule[],
    factors: FillUomFactorSource,
  ): Map<string, LocationFillDto> {
    const limitById = new Map(limits.map((limit) => [limit.id, limit]));
    const usageByItemType = new Map(
      rules.map((rule) => [`${rule.inventoryItemId}:${rule.storageTypeId}`, rule.usagePerPrimaryUnit]),
    );
    const quantsByLocation = new Map<string, FillQuantRow[]>();
    for (const quant of inputs.quants) {
      const list = quantsByLocation.get(quant.locationId) ?? [];
      list.push(quant);
      quantsByLocation.set(quant.locationId, list);
    }

    const membersByRoot = new Map<string, { locationId: string; storageTypeId: string | null }[]>();
    for (const member of inputs.members) {
      const list = membersByRoot.get(member.rootId) ?? [];
      list.push(member);
      membersByRoot.set(member.rootId, list);
    }

    const fills = new Map<string, LocationFillDto>();
    for (const rootId of inputs.locationIds) {
      const members = membersByRoot.get(rootId) ?? [];
      let capacitySum = new Decimal(0);
      let weightUsed = new Decimal(0);
      let volumeUsed = new Decimal(0);
      let weightMax: Decimal | null = null;
      let volumeMax: Decimal | null = null;
      const unconfiguredItemIds = new Set<string>();

      for (const member of members) {
        const totals = LocationsDomainService.measureLocation(
          quantsByLocation.get(member.locationId) ?? [],
          member.storageTypeId,
          usageByItemType,
          factors,
        );
        capacitySum = capacitySum.plus(totals.capacity);
        weightUsed = weightUsed.plus(totals.weight);
        volumeUsed = volumeUsed.plus(totals.volume);
        for (const itemId of totals.unconfiguredItemIds) unconfiguredItemIds.add(itemId);

        const limit = member.storageTypeId ? limitById.get(member.storageTypeId) : undefined;
        if (limit?.maxWeight != null) weightMax = (weightMax ?? new Decimal(0)).plus(limit.maxWeight);
        if (limit?.maxVolume != null) volumeMax = (volumeMax ?? new Decimal(0)).plus(limit.maxVolume);
      }

      fills.set(rootId, {
        capacityPercent:
          members.length > 0 ? capacitySum.dividedBy(members.length).toDecimalPlaces(CAPACITY_DP).toNumber() : 0,
        weightUsed: weightUsed.toDecimalPlaces(MEASURE_DP).toNumber(),
        weightMax: weightMax?.toDecimalPlaces(MEASURE_DP).toNumber() ?? null,
        volumeUsed: volumeUsed.toDecimalPlaces(MEASURE_DP).toNumber(),
        volumeMax: volumeMax?.toDecimalPlaces(MEASURE_DP).toNumber() ?? null,
        unconfiguredItemCount: unconfiguredItemIds.size,
      });
    }
    return fills;
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
    const parts = refLabels.filter(([n]) => n > 0).map(([n, label]) => `${n} ${pluralize(label, n)}`);
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

  private static toPathLabel(code: string): string {
    const normalized = code
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return normalized || 'loc';
  }

  private static buildPath(parentPath: string | null, code: string): string {
    const label = LocationsDomainService.toPathLabel(code);
    return parentPath ? `${parentPath}.${label}` : label;
  }

  private static readonly LOCATION_ROLE_LABELS: Record<LocationRole, string> = {
    STORAGE: 'Storage',
    RESERVED_STORAGE: 'Reserved Storage',
    ZONE: 'Zone',
  };

  // Display order for role groups in select dropdowns.
  private static readonly LOCATION_ROLE_GROUP_ORDER: LocationRole[] = [
    LocationRoleValues.RESERVED_STORAGE,
    LocationRoleValues.STORAGE,
    LocationRoleValues.ZONE,
  ];

  // Sums one storage location's quants: each quant splits into whole packs and loose primary units; capacity counts
  // packs × usage(pack) + loose × usage(primary), weight and volume take the pack's own figure (or factor × the primary
  // unit's) per pack plus the primary unit's per loose unit; a missing usage or figure marks the item unconfigured
  private static measureLocation(
    quants: FillQuantRow[],
    storageTypeId: string | null,
    usageByItemType: Map<string, Decimal>,
    factors: FillUomFactorSource,
  ): MeasureTotals {
    const totals: MeasureTotals = {
      capacity: new Decimal(0),
      weight: new Decimal(0),
      volume: new Decimal(0),
      unconfiguredItemIds: new Set<string>(),
    };

    for (const quant of quants) {
      const quantity = new Decimal(quant.quantity);
      const packFactor =
        quant.packUomId && quant.packUomId !== quant.primaryUomId
          ? factors.get(quant.inventoryItemId, quant.packUomId)
          : undefined;
      const packs = packFactor ? quantity.dividedBy(packFactor).floor() : new Decimal(0);
      const loose = packFactor ? quantity.minus(packs.times(packFactor)) : quantity;

      const usage = storageTypeId ? usageByItemType.get(`${quant.inventoryItemId}:${storageTypeId}`) : undefined;
      if (usage) {
        const packUsage = packFactor ? usage.times(packFactor) : new Decimal(0);
        totals.capacity = totals.capacity.plus(packs.times(packUsage)).plus(loose.times(usage));
      } else {
        totals.unconfiguredItemIds.add(quant.inventoryItemId);
      }

      const weight = LocationsDomainService.measure(packs, loose, packFactor, quant.packWeight, quant.primaryWeight);
      if (weight) totals.weight = totals.weight.plus(weight);
      else totals.unconfiguredItemIds.add(quant.inventoryItemId);

      const volume = LocationsDomainService.measure(packs, loose, packFactor, quant.packVolume, quant.primaryVolume);
      if (volume) totals.volume = totals.volume.plus(volume);
      else totals.unconfiguredItemIds.add(quant.inventoryItemId);
    }
    return totals;
  }

  // Weighs (or measures) packs and loose units; undefined when a figure the quant needs is not maintained
  private static measure(
    packs: Decimal,
    loose: Decimal,
    packFactor: Decimal | undefined,
    packValue: number | null,
    primaryValue: number | null,
  ): Decimal | undefined {
    let total = new Decimal(0);
    if (packs.greaterThan(0)) {
      const perPack =
        packValue != null
          ? new Decimal(packValue)
          : primaryValue != null && packFactor
            ? packFactor.times(primaryValue)
            : undefined;
      if (!perPack) return undefined;
      total = total.plus(packs.times(perPack));
    }
    if (loose.greaterThan(0)) {
      if (primaryValue == null) return undefined;
      total = total.plus(loose.times(primaryValue));
    }
    return total;
  }

  // Recomputes the effective storage type down a subtree from its root's new type: a location that overrides keeps
  // its own, every other takes its parent's; returns the rows whose type changes
  private static inheritStorageTypes(
    subtree: SubtreeRow[],
    rootId: string,
    rootStorageTypeId: string | null,
  ): (LocationStorageTypeChange & { locationRole: SubtreeRow['locationRole'] })[] {
    const effective = new Map<string, string | null>([[rootId, rootStorageTypeId]]);
    const changes: (LocationStorageTypeChange & { locationRole: SubtreeRow['locationRole'] })[] = [];
    for (const row of subtree) {
      const next =
        row.id === rootId
          ? rootStorageTypeId
          : row.isStorageTypeOverridden
            ? row.storageTypeId
            : (effective.get(row.parentId ?? '') ?? null);
      effective.set(row.id, next);
      if (next !== row.storageTypeId) {
        changes.push({ id: row.id, name: row.name, storageTypeId: next, locationRole: row.locationRole });
      }
    }
    return changes;
  }

  // Groups location ids by the storage type they move to
  private static groupByStorageType(changes: LocationStorageTypeChange[]): Map<string | null, string[]> {
    const groups = new Map<string | null, string[]>();
    for (const change of changes) {
      const ids = groups.get(change.storageTypeId) ?? [];
      ids.push(change.id);
      groups.set(change.storageTypeId, ids);
    }
    return groups;
  }

  // A storage location must end with a storage type, its own or inherited from a zone
  private static storageTypeRequired(locationNames: string[]): ConflictException {
    const names = locationNames.map((name) => `"${name}"`).join(', ');
    return new ConflictException({
      label: 'Storage Type Required',
      detail: `${names} would have no storage type. Pick a storage type, or give the parent zone one to inherit.`,
      errors: [{ field: 'storageTypeId', message: 'Storage type required' }],
    });
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
