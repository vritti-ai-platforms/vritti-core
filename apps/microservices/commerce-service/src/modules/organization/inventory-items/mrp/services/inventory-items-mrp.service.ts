import { InventoryItemMrpsService } from '@domain/inventory-item-mrps/services/inventory-item-mrps.service';
import { Injectable, Logger } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import { ConflictException, NotFoundException, ValidationException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import { type CurrencyCode, majorToMinor } from '@vritti/api-sdk/money';
import type { AddInventoryItemMrpDto } from '../dto/request/add-inventory-item-mrp.dto';
import type { UpdateInventoryItemMrpDto } from '../dto/request/update-inventory-item-mrp.dto';
import { InventoryItemMrpDto } from '../dto/entity/inventory-item-mrp.dto';

// Org-scope service for the manual suggested-MRP table: reads the per-currency MRPs and
// adds/edits/removes them (major-unit money in, minor-unit bigint into the domain).
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

  // Adds a new suggested MRP for an (item, uom, currency); rejects duplicates and out-of-family units
  async add(dto: AddInventoryItemMrpDto): Promise<InventoryItemMrpDto> {
    this.logger.log(`add — inventoryItemId=${dto.inventoryItemId}, uomId=${dto.uomId}, currency=${dto.amount.currency}`);
    const inFamily = await this.mrpsService.isUomInItemFamily(dto.inventoryItemId, dto.uomId);
    if (!inFamily) {
      throw new ValidationException({
        detail: "MRP unit must belong to the item's unit family.",
        errors: [{ field: 'uomId', message: "Pick a unit in the item's unit family." }],
      });
    }
    const currencyCode = dto.amount.currency as CurrencyCode;
    const amount = majorToMinor(dto.amount.value, currencyCode, 'amount');
    try {
      const row = await this.mrpsService.create(dto.inventoryItemId, dto.uomId, currencyCode, amount);
      return InventoryItemMrpDto.from(row);
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          label: 'Duplicate MRP',
          detail: 'An MRP for this unit and currency already exists — edit it instead.',
        });
      }
      throw error;
    }
  }

  // Updates an existing MRP row's amount by id; the unit is fixed on edit
  async update(dto: UpdateInventoryItemMrpDto): Promise<InventoryItemMrpDto> {
    this.logger.log(`update — id=${dto.id}, currency=${dto.amount.currency}`);
    const currencyCode = dto.amount.currency as CurrencyCode;
    const amount = majorToMinor(dto.amount.value, currencyCode, 'amount');
    const row = await this.mrpsService.updateAmount(dto.id, amount);
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

  // Returns true when the pg error is a unique-constraint violation
  private isUniqueViolation(error: unknown): boolean {
    return _.get(error, 'code') === '23505';
  }
}
