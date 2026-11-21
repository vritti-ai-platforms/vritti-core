import { InventoryItemLotsDomainService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import { StockAdjustmentLotsDomainRepository } from '@domain/stock-adjustment-lots/repositories/stock-adjustment-lots.repository';
import { StockAdjustmentLotsDomainService } from '@domain/stock-adjustment-lots/services/stock-adjustment-lots.service';
import { StockAdjustmentsDomainService } from '@domain/stock-adjustments/services/stock-adjustments.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { NotFoundException, ValidationException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { DisplayUnitRatios, InventoryItemLot } from '@/db/schema';
import type {
  StockAdjustmentLotDetailWithDisplayDto,
  StockAdjustmentLotDisplayDto,
  StockAdjustmentLotWithDisplayDto,
  StockAdjustmentTreeLotNodeWithDisplayDto,
} from '../dto/entity/stock-adjustment-lot-with-display.dto';

// App-layer orchestrator for stock-adjustment lot writes that need inventory-aggregate awareness.
@Injectable()
export class StockAdjustmentsLotsService {
  private readonly logger = new Logger(StockAdjustmentsLotsService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly adjustmentsService: StockAdjustmentsDomainService,
    private readonly lotsService: StockAdjustmentLotsDomainService,
    private readonly lotsRepository: StockAdjustmentLotsDomainRepository,
    private readonly inventoryItemLotsService: InventoryItemLotsDomainService,
    private readonly uomConversionsService: UomConversionsDomainService,
  ) {}

  async addLot(
    adjustmentId: string,
    data: { lotNumber: string; manufacturingDate?: string | null; expiryDate: string; mrp?: bigint | null },
  ): Promise<CreateResponseDto<{ id: string; lotNumber: string }>> {
    const adjustment = await this.adjustmentsService.findById(adjustmentId);
    const trimmed = data.lotNumber;
    if (trimmed) {
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
  ): Promise<StockAdjustmentLotWithDisplayDto> {
    const adjustment = await this.adjustmentsService.findById(adjustmentId);
    if (data.lotNumber) {
      const inventoryDup = await this.inventoryItemLotsService.findByItemAndNumber(
        adjustment.inventoryItemId,
        data.lotNumber,
      );
      if (inventoryDup) {
        throw new ValidationException({
          detail: `Lot "${data.lotNumber}" already exists in inventory.`,
          errors: [{ field: 'lotNumber', message: 'Lot already exists in inventory.' }],
        });
      }
    }
    const { displayUnitRatios, ...lot } = await this.lotsService.updateLot(adjustment, lotId, data);
    return { ...lot, display: this.toDisplay(lot.totalQuantity, displayUnitRatios) };
  }

  // Returns an adjustment's draft lots
  async findByAdjustmentId(adjustmentId: string): Promise<StockAdjustmentLotWithDisplayDto[]> {
    const lots = await this.lotsService.listByAdjustment(adjustmentId);
    return lots.map(({ displayUnitRatios, ...lot }) => ({
      ...lot,
      display: this.toDisplay(lot.totalQuantity, displayUnitRatios),
    }));
  }

  // Returns one draft lot of an adjustment with its stats
  async findLotDetail(adjustmentId: string, lotId: string): Promise<StockAdjustmentLotDetailWithDisplayDto> {
    const { displayUnitRatios, ...lot } = await this.lotsService.getLotDetail(adjustmentId, lotId);
    return { ...lot, display: this.toDisplay(lot.totalQuantity, displayUnitRatios) };
  }

  // Returns an adjustment's draft lots with their lines as a tree
  async findTree(adjustmentId: string): Promise<StockAdjustmentTreeLotNodeWithDisplayDto[]> {
    const nodes = await this.lotsService.findTreeForAdjustment(adjustmentId);
    return nodes.map(({ displayUnitRatios, ...node }) => ({
      ...node,
      display: this.toDisplay(node.totalQuantity ?? null, displayUnitRatios),
    }));
  }

  // Used by the publish flow: creates the matching inventory_item_lots row from this draft lot.
  async resolveInventoryLot(inventoryItemId: string, lotId: string, leCurrencyCode: string): Promise<InventoryItemLot> {
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
        mrpCurrencyCode: sa.mrp != null ? leCurrencyCode : null,
      });
      await this.lotsRepository.setResolvedLotId(lotId, inserted.id);
      this.logger.log(`Resolved draft lot ${lotId} → inventory lot ${inserted.id}`);
      return inserted;
    });
  }

  // Removes a lot from a DRAFT adjustment — fetches the adjustment context then delegates to domain
  async removeLot(adjustmentId: string, lotId: string): Promise<SuccessResponseDto> {
    const adjustment = await this.adjustmentsService.findById(adjustmentId);
    return this.lotsService.removeLot(adjustment, lotId);
  }

  // Expresses a lot's total primary quantity in the item's display unit
  private toDisplay(totalQuantity: number | null, ratios: DisplayUnitRatios): StockAdjustmentLotDisplayDto {
    return this.uomConversionsService.toDisplayUomQuantities({ totalQuantity }, ratios);
  }
}
