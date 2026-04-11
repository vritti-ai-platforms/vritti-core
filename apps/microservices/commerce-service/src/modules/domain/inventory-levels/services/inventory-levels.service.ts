import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk';
import type { InventoryLedgerEntry, InventoryLedgerType, InventoryLevel } from '@/db/schema';
import { InventoryLedgerDto, InventoryLevelDto } from '@domain/inventory-items/dto/entity/inventory-item.dto';
import { InventoryLevelsRepository } from '../repositories/inventory-levels.repository';

@Injectable()
export class InventoryLevelsService {
  private readonly logger = new Logger(InventoryLevelsService.name);

  constructor(private readonly repository: InventoryLevelsRepository) {}

  // Adds stock to a level and records a ledger entry
  async addStock(params: {
    itemId: string;
    locationId: string;
    quantity: number;
    type: InventoryLedgerType;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
  }): Promise<{ level: InventoryLevel; ledgerEntry: InventoryLedgerEntry }> {
    const level = await this.repository.findOrCreateLevel(params.itemId, params.locationId);
    const updatedLevel = await this.repository.updateStockedQuantity(level.id, String(params.quantity));
    const balanceAfter = Number(updatedLevel.stockedQuantity);

    const ledgerEntry = await this.repository.createLedgerEntry({
      inventoryItemId: params.itemId,
      type: params.type,
      quantity: String(params.quantity),
      balanceAfter: String(balanceAfter),
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      notes: params.notes,
    });

    this.logger.log(`Added ${params.quantity} to item ${params.itemId} at location ${params.locationId} (${params.type})`);
    return { level: updatedLevel, ledgerEntry };
  }

  // Deducts stock from a level and records a ledger entry
  async deductStock(params: {
    itemId: string;
    locationId: string;
    quantity: number;
    type: InventoryLedgerType;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
  }): Promise<{ level: InventoryLevel; ledgerEntry: InventoryLedgerEntry }> {
    const level = await this.repository.findOrCreateLevel(params.itemId, params.locationId);
    const available = Number(level.stockedQuantity) - Number(level.reservedQuantity);

    if (available < params.quantity) {
      throw new BadRequestException('Insufficient stock.');
    }

    const updatedLevel = await this.repository.updateStockedQuantity(level.id, String(-params.quantity));
    const balanceAfter = Number(updatedLevel.stockedQuantity);

    const ledgerEntry = await this.repository.createLedgerEntry({
      inventoryItemId: params.itemId,
      type: params.type,
      quantity: String(-params.quantity),
      balanceAfter: String(balanceAfter),
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      notes: params.notes,
    });

    this.logger.log(`Deducted ${params.quantity} from item ${params.itemId} at location ${params.locationId} (${params.type})`);
    return { level: updatedLevel, ledgerEntry };
  }

  // Reserves stock by increasing reserved quantity
  async reserve(params: {
    itemId: string;
    locationId: string;
    quantity: number;
    referenceId?: string;
  }): Promise<InventoryLevel> {
    const level = await this.repository.findOrCreateLevel(params.itemId, params.locationId);
    const available = Number(level.stockedQuantity) - Number(level.reservedQuantity);

    if (available < params.quantity) {
      throw new BadRequestException('Insufficient available stock to reserve.');
    }

    const updatedLevel = await this.repository.updateReservedQuantity(level.id, String(params.quantity));
    this.logger.log(`Reserved ${params.quantity} of item ${params.itemId} at location ${params.locationId}`);
    return updatedLevel;
  }

  // Releases a reservation by decreasing reserved quantity
  async releaseReserve(params: {
    itemId: string;
    locationId: string;
    quantity: number;
    referenceId?: string;
  }): Promise<InventoryLevel> {
    const level = await this.repository.findOrCreateLevel(params.itemId, params.locationId);
    const updatedLevel = await this.repository.updateReservedQuantity(level.id, String(-params.quantity));
    this.logger.log(`Released reservation of ${params.quantity} for item ${params.itemId} at location ${params.locationId}`);
    return updatedLevel;
  }

  // Returns stock levels for an item with location names
  async findLevelsByItemId(itemId: string): Promise<InventoryLevelDto[]> {
    const levels = await this.repository.findLevelsByItemId(itemId);
    return levels.map(InventoryLevelDto.from);
  }

  // Returns recent ledger entries for an item
  async findLedgerByItemId(itemId: string, limit?: number): Promise<InventoryLedgerDto[]> {
    const entries = await this.repository.findLedgerByItemId(itemId, limit);
    return entries.map(InventoryLedgerDto.from);
  }
}
