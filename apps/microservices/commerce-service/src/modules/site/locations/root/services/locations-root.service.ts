import { InventoryItemStorageTypesDomainService } from '@domain/inventory-item-storage-types/services/inventory-item-storage-types.service';
import type { LocationDto } from '@domain/locations/dto/entity/location.dto';
import type { LocationFillDto } from '@domain/locations/dto/entity/location-fill.dto';
import type { LocationTreeDto } from '@domain/locations/dto/entity/location-tree.dto';
import type { CreateLocationDto } from '@domain/locations/dto/request/create-location.dto';
import type { UpdateLocationDto } from '@domain/locations/dto/request/update-location.dto';
import { LocationsDomainService } from '@domain/locations/services/locations.service';
import { StorageTypesDomainService } from '@domain/storage-types/services/storage-types.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

// Top-level service for site location paths that span domains: storage types are validated against the storage-types
// domain, a type change is checked against the item × storage type rows, and every location read carries its fill.
@Injectable()
export class SiteLocationsService {
  private readonly logger = new Logger(SiteLocationsService.name);

  constructor(
    private readonly locationsService: LocationsDomainService,
    private readonly storageTypesService: StorageTypesDomainService,
    private readonly itemStorageTypesService: InventoryItemStorageTypesDomainService,
    private readonly uomConversionsService: UomConversionsDomainService,
  ) {}

  // Returns the location tree with each node's storage type and fill
  async findTree(search?: string): Promise<LocationTreeDto[]> {
    const tree = await this.locationsService.findTree(search);
    const nodes = flattenTree(tree);
    const fills = await this.computeFills(nodes.map((node) => node.id));
    for (const node of nodes) node.fill = fills.get(node.id) ?? null;
    return tree;
  }

  // Returns a page of child locations with their storage types and fill
  async findChildrenForTable(parentId: string, state: TableState): Promise<{ result: LocationDto[]; count: number }> {
    const page = await this.locationsService.findChildrenForTable(parentId, state);
    await this.attachFills(page.result);
    return page;
  }

  // Returns one location with its storage type and fill
  async findById(id: string): Promise<LocationDto> {
    const location = await this.locationsService.findById(id);
    await this.attachFills([location]);
    return location;
  }

  // Creates a location after checking the storage type it is given can be assigned
  async create(dto: CreateLocationDto): Promise<CreateResponseDto<LocationDto>> {
    this.logger.log(`create — code=${dto.code}, storageTypeId=${dto.storageTypeId ?? 'inherited'}`);
    if (dto.storageTypeId && !dto.inheritStorageType) {
      await this.storageTypesService.requireAssignable(dto.storageTypeId, 'storageTypeId');
    }
    const created = await this.locationsService.create(dto);
    await this.attachFills([created.data]);
    return created;
  }

  // Updates a location; a storage type change is refused when it would disallow an item stored in an affected location
  async update(id: string, dto: UpdateLocationDto): Promise<SuccessResponseDto> {
    const plan = await this.locationsService.planUpdate(id, dto);
    this.logger.log(`update — id=${id}, storageTypeChanges=${plan.storageTypeChanges.length}`);
    if (plan.assignedStorageTypeId) {
      await this.storageTypesService.requireAssignable(plan.assignedStorageTypeId, 'storageTypeId');
    }

    const placements = await this.locationsService.findStoredItemPlacements(plan);
    if (placements.length > 0) {
      const allowances = await this.itemStorageTypesService.findAllowances(
        [...new Set(placements.map((p) => p.inventoryItemId))],
        [...new Set(placements.map((p) => p.storageTypeId))],
      );
      this.itemStorageTypesService.assertPlacementsAllowed(placements, allowances);
    }

    return this.locationsService.applyUpdate(plan);
  }

  // Sets the fill of each location
  private async attachFills(locations: LocationDto[]): Promise<void> {
    const fills = await this.computeFills(locations.map((location) => location.id));
    for (const location of locations) location.fill = fills.get(location.id) ?? null;
  }

  // Gathers the quants, storage type limits, item × storage type usage and unit factors the fill needs
  private async computeFills(locationIds: string[]): Promise<Map<string, LocationFillDto>> {
    if (locationIds.length === 0) return new Map();
    const inputs = await this.locationsService.findFillInputs(locationIds);
    const [limits, allowances] = await Promise.all([
      this.storageTypesService.findLimitsByIds(inputs.storageTypeIds),
      this.itemStorageTypesService.findAllowances(inputs.inventoryItemIds, inputs.storageTypeIds),
    ]);
    const factors = await this.uomConversionsService.resolveFactors([
      ...inputs.packUomPairs,
      ...allowances.map((row) => ({ inventoryItemId: row.inventoryItemId, uomId: row.uomId })),
    ]);
    const rules = this.itemStorageTypesService.buildUsageRules(allowances, factors);
    return this.locationsService.computeFill(inputs, limits, rules, factors);
  }
}

// Lists every node of a location tree
function flattenTree(nodes: LocationTreeDto[]): LocationTreeDto[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children ?? [])]);
}
