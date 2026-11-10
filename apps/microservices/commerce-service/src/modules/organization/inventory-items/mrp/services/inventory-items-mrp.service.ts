import { InventoryItemMrpDto } from '@domain/inventory-item-mrps/dto/entity/inventory-item-mrp.dto';
import type { AddInventoryItemMrpDto } from '@domain/inventory-item-mrps/dto/request/add-inventory-item-mrp.dto';
import type { UpdateInventoryItemMrpDto } from '@domain/inventory-item-mrps/dto/request/update-inventory-item-mrp.dto';
import { InventoryItemMrpsDomainService } from '@domain/inventory-item-mrps/services/inventory-item-mrps.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableState } from '@vritti/api-sdk/data-table';
import { NotFoundException, ValidationException } from '@vritti/api-sdk/exceptions';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';

// Org-scope service for the manual suggested-MRP table: reads the per-currency MRPs and adds/edits/removes them,
// delegating money conversion to the domain service.
@Injectable()
export class InventoryItemsMrpService {
  private readonly logger = new Logger(InventoryItemsMrpService.name);

  constructor(private readonly mrpsService: InventoryItemMrpsDomainService) {}

  // Returns one item's MRPs for the data table
  findForTable(inventoryItemId: string, state: TableState): Promise<{ result: InventoryItemMrpDto[]; count: number }> {
    this.logger.log(`findForTable — inventoryItemId=${inventoryItemId}`);
    return this.mrpsService.findForTable(inventoryItemId, state);
  }

  // Adds a new suggested MRP for an (item, uom, currency); rejects duplicates and out-of-family units
  async add(dto: AddInventoryItemMrpDto): Promise<InventoryItemMrpDto> {
    this.logger.log(
      `add — inventoryItemId=${dto.inventoryItemId}, uomId=${dto.uomId}, currency=${dto.amount.currency}`,
    );
    const inFamily = await this.mrpsService.isUomInItemFamily(dto.inventoryItemId, dto.uomId);
    if (!inFamily) {
      throw new ValidationException({
        detail: "MRP unit must belong to the item's unit family.",
        errors: [{ field: 'uomId', message: "Pick a unit in the item's unit family." }],
      });
    }
    const row = await this.mrpsService.create(dto);
    return InventoryItemMrpDto.from(row);
  }

  // Updates an existing MRP row's amount by id; the unit is fixed on edit
  async update(dto: UpdateInventoryItemMrpDto): Promise<InventoryItemMrpDto> {
    this.logger.log(`update — id=${dto.id}, currency=${dto.amount.currency}`);
    const row = await this.mrpsService.updateAmount(dto);
    if (!row) {
      throw new NotFoundException({ label: 'MRP Not Found', detail: 'MRP not found.' });
    }
    return InventoryItemMrpDto.from(row);
  }

  // Promotes one recorded MRP to the current one shown on listings
  async setCurrent(id: string): Promise<InventoryItemMrpDto> {
    this.logger.log(`setCurrent — id=${id}`);
    const row = await this.mrpsService.setCurrent(id);
    if (!row) {
      throw new NotFoundException({ label: 'MRP Not Found', detail: 'MRP not found.' });
    }
    return InventoryItemMrpDto.from(row);
  }

  // Deletes an MRP row by id
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`delete — id=${id}`);
    const row = await this.mrpsService.delete(id);
    if (!row) {
      throw new NotFoundException({ label: 'MRP Not Found', detail: 'MRP not found.' });
    }
    return { success: true, message: 'MRP deleted successfully.' };
  }
}
