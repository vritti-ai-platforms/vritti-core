import { Injectable, Logger } from '@nestjs/common';
import Decimal from '@vritti/api-sdk/decimal';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import {
  InventoryItemStorageTypeDto,
  type InventoryItemStorageTypeRow,
} from '../dto/entity/inventory-item-storage-type.dto';
import type {
  StorageAllowanceDto,
  StorageUsageRuleDto,
  StoredItemPlacementDto,
  UomFactorSource,
} from '../dto/entity/storage-usage-rule.dto';
import { InventoryItemStorageTypesDomainRepository } from '../repositories/inventory-item-storage-types.repository';

const LOCATION_CAPACITY = 100;
const MAX_NAMED_PLACEMENTS = 5;

interface InventoryItemContext {
  inventoryItemId: string;
  allowedUomIds: string[];
}

@Injectable()
export class InventoryItemStorageTypesDomainService {
  private readonly logger = new Logger(InventoryItemStorageTypesDomainService.name);

  constructor(private readonly repository: InventoryItemStorageTypesDomainRepository) {}

  // Allows an item in a storage type, with how much of it one location of that type holds
  async create(
    item: InventoryItemContext,
    data: { storageTypeId: string; maxQuantity: number; uomId: string },
  ): Promise<CreateResponseDto<{ id: string }>> {
    this.assertUomAllowed(item, data.uomId);
    if (await this.repository.existsForItemAndType(item.inventoryItemId, data.storageTypeId)) {
      throw new ConflictException({
        label: 'Storage Type Already Allowed',
        detail: 'This item already has a row for the storage type. Edit that row instead.',
        errors: [{ field: 'storageTypeId', message: 'Already allowed' }],
      });
    }

    const entity = await this.repository.create({
      inventoryItemId: item.inventoryItemId,
      storageTypeId: data.storageTypeId,
      maxQuantity: data.maxQuantity,
      uomId: data.uomId,
    });
    this.logger.log(`Allowed inventory item ${item.inventoryItemId} in storage type ${data.storageTypeId}`);
    return {
      success: true,
      message: 'Item allowed in the storage type.',
      data: { id: entity.id },
    };
  }

  // Changes the max quantity per location, or the unit it is counted in
  async update(
    item: InventoryItemContext,
    id: string,
    data: { maxQuantity?: number; uomId?: string },
  ): Promise<SuccessResponseDto> {
    const existing = await this.findRowOrThrow(item.inventoryItemId, id);
    if (data.uomId !== undefined) this.assertUomAllowed(item, data.uomId);
    await this.repository.update(id, { maxQuantity: data.maxQuantity, uomId: data.uomId });
    this.logger.log(`Updated item × storage type ${id}`);
    return { success: true, message: `Storage limits in "${existing.storageTypeName}" updated successfully.` };
  }

  // Returns the storage types an item may be stored in, with the max quantity per location of each
  async findAll(inventoryItemId: string): Promise<InventoryItemStorageTypeDto[]> {
    const rows = await this.repository.findAllByInventoryItemId(inventoryItemId);
    return rows.map((row) => InventoryItemStorageTypeDto.from(row));
  }

  // Returns the rows pairing any of the items with any of the storage types
  findAllowances(inventoryItemIds: string[], storageTypeIds: string[]): Promise<StorageAllowanceDto[]> {
    return this.repository.findAllowances(inventoryItemIds, storageTypeIds);
  }

  // Derives each row's capacity usage per primary unit: 100 ÷ (maxQuantity × factor(row unit → primary)); a row whose
  // unit has no conversion to the primary unit is left out
  buildUsageRules(allowances: StorageAllowanceDto[], factors: UomFactorSource): StorageUsageRuleDto[] {
    const rules: StorageUsageRuleDto[] = [];
    for (const allowance of allowances) {
      const factor = factors.get(allowance.inventoryItemId, allowance.uomId);
      if (!factor) continue;
      rules.push({
        inventoryItemId: allowance.inventoryItemId,
        storageTypeId: allowance.storageTypeId,
        usagePerPrimaryUnit: new Decimal(LOCATION_CAPACITY).dividedBy(new Decimal(allowance.maxQuantity).times(factor)),
      });
    }
    return rules;
  }

  // Rejects storage type changes that would leave stored items in a location whose type does not allow them
  assertPlacementsAllowed(placements: StoredItemPlacementDto[], allowances: StorageAllowanceDto[]): void {
    const allowed = new Set(allowances.map((row) => `${row.inventoryItemId}:${row.storageTypeId}`));
    const refused = placements.filter((p) => !allowed.has(`${p.inventoryItemId}:${p.storageTypeId}`));
    if (refused.length === 0) return;
    const pairs = refused.map((p) => `"${p.inventoryItemName}" in "${p.locationName}"`);
    throw new ConflictException({
      label: 'Stored Items Not Allowed',
      detail: `The new storage type does not allow ${namedList(pairs)}. Allow those items in the storage type or move their stock first.`,
    });
  }

  // Removes an item's storage type unless the item has stock in a location of that type
  async delete(inventoryItemId: string, id: string): Promise<SuccessResponseDto> {
    const existing = await this.findRowOrThrow(inventoryItemId, id);
    const stockedAt = await this.repository.findStockedLocationNames(inventoryItemId, existing.storageTypeId);
    if (stockedAt.length > 0) {
      throw new ConflictException({
        label: 'Item Stored In This Type',
        detail: `The item has stock in ${namedList(stockedAt)} of storage type "${existing.storageTypeName}". Move that stock before removing the storage type.`,
      });
    }
    await this.repository.delete(id);
    this.logger.log(`Removed storage type ${existing.storageTypeId} from inventory item ${inventoryItemId}`);
    return { success: true, message: `Item no longer allowed in "${existing.storageTypeName}".` };
  }

  // Loads a row of the item, throwing when it is missing or belongs to another item
  private async findRowOrThrow(inventoryItemId: string, id: string): Promise<InventoryItemStorageTypeRow> {
    const row = await this.repository.findDetail(id);
    if (!row || row.inventoryItemId !== inventoryItemId) {
      throw new NotFoundException('Item storage type not found.');
    }
    return row;
  }

  // The unit must be one the item can be counted in
  private assertUomAllowed(item: InventoryItemContext, uomId: string): void {
    if (item.allowedUomIds.includes(uomId)) return;
    throw new BadRequestException({
      label: 'Unit Not Convertible',
      detail: "The unit has no conversion to the item's primary unit. Add a conversion or pick another unit.",
      errors: [{ field: 'uomId', message: 'No conversion for this item' }],
    });
  }
}

// Lists the first few names and counts the rest
function namedList(names: string[]): string {
  const shown = names.slice(0, MAX_NAMED_PLACEMENTS).join(', ');
  const rest = names.length - MAX_NAMED_PLACEMENTS;
  return rest > 0 ? `${shown} and ${rest} more` : shown;
}
