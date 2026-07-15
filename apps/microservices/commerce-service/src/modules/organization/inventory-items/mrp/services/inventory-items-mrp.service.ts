import { InventoryItemMrpsService } from '@domain/inventory-item-mrps/services/inventory-item-mrps.service';
import { Injectable, Logger } from '@nestjs/common';
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

  // Records the latest suggested MRP for an (item, currency)
  async upsert(dto: UpsertInventoryItemMrpDto): Promise<InventoryItemMrpDto> {
    this.logger.log(`upsert — inventoryItemId=${dto.inventoryItemId}, currency=${dto.amount.currency}`);
    const currencyCode = dto.amount.currency as CurrencyCode;
    const amount = majorToMinor(dto.amount.value, currencyCode, 'amount');
    const row = await this.mrpsService.upsertForCurrency(
      dto.inventoryItemId,
      currencyCode,
      amount,
      dto.sourceLotId ?? null,
    );
    return InventoryItemMrpDto.from(row);
  }
}
