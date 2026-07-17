import { InventoryItemMrpsService } from '@domain/inventory-item-mrps/services/inventory-item-mrps.service';
import { Injectable, Logger } from '@nestjs/common';
import { ValidationException } from '@vritti/api-sdk/exceptions';
import { type CurrencyCode, majorToMinor } from '@vritti/api-sdk/money';
import { InventoryItemMrpDto } from '../dto/entity/inventory-item-mrp.dto';
import type { UpsertInventoryItemMrpDto } from '../dto/request/upsert-inventory-item-mrp.dto';

// Org-scope service for the suggested-MRP table: reads the per-currency MRPs and
// records new ones (major-unit money in, minor-unit bigint into the domain).
@Injectable()
export class InventoryItemsMrpService {
  private readonly logger = new Logger(InventoryItemsMrpService.name);

  constructor(private readonly mrpsService: InventoryItemMrpsService) {}

  // Returns the suggested MRPs for an inventory item (one per currency)
  async findByItem(inventoryItemId: string): Promise<InventoryItemMrpDto[]> {
    this.logger.log(`findByItem — inventoryItemId=${inventoryItemId}`);
    const rows = await this.mrpsService.findByItem(inventoryItemId);
    return rows.map((row) => InventoryItemMrpDto.from(row));
  }

  // Records the latest suggested MRP for an (item, uom, currency)
  async upsert(dto: UpsertInventoryItemMrpDto): Promise<InventoryItemMrpDto> {
    this.logger.log(`upsert — inventoryItemId=${dto.inventoryItemId}, uomId=${dto.uomId}, currency=${dto.amount.currency}`);
    const inFamily = await this.mrpsService.isUomInItemFamily(dto.inventoryItemId, dto.uomId);
    if (!inFamily) {
      throw new ValidationException({
        detail: "MRP unit must belong to the item's unit family.",
        errors: [{ field: 'uomId', message: "Pick a unit in the item's unit family." }],
      });
    }
    const currencyCode = dto.amount.currency as CurrencyCode;
    const amount = majorToMinor(dto.amount.value, currencyCode, 'amount');
    const row = await this.mrpsService.upsert(dto.inventoryItemId, dto.uomId, currencyCode, amount, dto.sourceLotId ?? null);
    return InventoryItemMrpDto.from(row);
  }
}
