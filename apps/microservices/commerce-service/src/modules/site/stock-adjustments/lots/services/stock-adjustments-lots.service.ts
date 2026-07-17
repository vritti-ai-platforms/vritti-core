import { InventoryItemLotsService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import { StockAdjustmentLotDto } from '@domain/stock-adjustment-lots/dto/entity/stock-adjustment-lot.dto';
import { StockAdjustmentLotsRepository } from '@domain/stock-adjustment-lots/repositories/stock-adjustment-lots.repository';
import { StockAdjustmentLotsService } from '@domain/stock-adjustment-lots/services/stock-adjustment-lots.service';
import { StockAdjustmentsService } from '@domain/stock-adjustments/services/stock-adjustments.service';
import { Injectable, Logger } from '@nestjs/common';
import { type CreateResponseDto, PrimaryDatabaseService, type SuccessResponseDto } from '@vritti/api-sdk/database';
import { NotFoundException, ValidationException } from '@vritti/api-sdk/exceptions';
import type { InventoryItemLot } from '@/db/schema';

// App-layer orchestrator for stock-adjustment lot writes that need inventory-aggregate awareness.
// Keeps domain `StockAdjustmentLotsService` self-contained while this layer crosses to inventory-item-lots.
@Injectable()
export class StockAdjustmentsLotsService {
  private readonly logger = new Logger(StockAdjustmentsLotsService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly adjustmentsService: StockAdjustmentsService,
    private readonly lotsService: StockAdjustmentLotsService,
    private readonly lotsRepository: StockAdjustmentLotsRepository,
    private readonly inventoryItemLotsService: InventoryItemLotsService,
  ) {}

  async addLot(
    adjustmentId: string,
    data: { lotNumber: string; manufacturingDate?: string | null; expiryDate: string; mrp?: bigint | null },
  ): Promise<CreateResponseDto<StockAdjustmentLotDto>> {
    const adjustment = await this.adjustmentsService.findById(adjustmentId);
    const trimmed = data.lotNumber;
    if (trimmed) {
      // Reject if a lot with the same number already exists in inventory for this item.
      // OPENING_STOCK can only register new lots — published lots can't be re-registered through a draft.
      const inventoryLot = await this.inventoryItemLotsService.findByItemAndNumber(adjustment.inventoryItemId, trimmed);
      if (inventoryLot) {
        throw new ValidationException({
          detail: `Lot "${trimmed}" already exists in inventory. OPENING_STOCK can only register new lots.`,
          errors: [{ field: 'lotNumber', message: 'Lot already exists in inventory.' }],
        });
      }
    }
    return this.lotsService.addLot(adjustment, data);
  }

  async updateLot(
    adjustmentId: string,
    lotId: string,
    data: { lotNumber?: string; manufacturingDate?: string | null; expiryDate?: string; mrp?: bigint | null },
  ): Promise<StockAdjustmentLotDto> {
    if (data.lotNumber !== undefined) {
      const trimmed = data.lotNumber;
      if (trimmed) {
        const adjustment = await this.adjustmentsService.findById(adjustmentId);
        const inventoryDup = await this.inventoryItemLotsService.findByItemAndNumber(
          adjustment.inventoryItemId,
          trimmed,
        );
        if (inventoryDup) {
          throw new ValidationException({
            detail: `Lot "${trimmed}" already exists in inventory.`,
            errors: [{ field: 'lotNumber', message: 'Lot already exists in inventory.' }],
          });
        }
        return this.lotsService.updateLot(adjustment, lotId, data);
      }
    }
    const adjustment = await this.adjustmentsService.findById(adjustmentId);
    return this.lotsService.updateLot(adjustment, lotId, data);
  }

  // Removes a lot from a DRAFT adjustment — fetches the adjustment context then delegates to domain
  async removeLot(adjustmentId: string, lotId: string): Promise<SuccessResponseDto> {
    const adjustment = await this.adjustmentsService.findById(adjustmentId);
    return this.lotsService.removeLot(adjustment, lotId);
  }

  // Used by the publish flow: creates the matching inventory_item_lots row from this draft lot.
  // Throws if a lot with the same (item, number) already exists in inventory (cannot reuse).
  async resolveInventoryLot(inventoryItemId: string, lotId: string): Promise<InventoryItemLot> {
    const sa = await this.lotsRepository.findById(lotId);
    if (!sa) throw new NotFoundException(`Stock adjustment lot ${lotId} not found.`);
    if (!sa.expiryDate) {
      throw new Error(`Stock adjustment lot ${lotId} is missing an expiry date.`);
    }
    return this.database.runInTransaction(async () => {
      const inserted = await this.inventoryItemLotsService.createLot({
        inventoryItemId,
        lotNumber: sa.lotNumber,
        manufacturingDate: sa.manufacturingDate ?? null,
        expiryDate: sa.expiryDate,
        mrp: sa.mrp ?? null,
      });
      await this.lotsRepository.setResolvedLotId(lotId, inserted.id);
      this.logger.log(`Resolved draft lot ${lotId} → inventory lot ${inserted.id}`);
      return inserted;
    });
  }
}
