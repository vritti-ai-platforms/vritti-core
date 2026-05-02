import { InventoryItemLotsRepository } from '@domain/inventory-item-lots/repositories/inventory-item-lots.repository';
import { StockAdjustmentLinesRepository } from '@domain/stock-adjustment-lines/repositories/stock-adjustment-lines.repository';
import { StockAdjustmentsRepository } from '@domain/stock-adjustments/repositories/stock-adjustments.repository';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  NotFoundException,
  type SuccessResponseDto,
  type TypedDrizzleClient,
  ValidationException,
} from '@vritti/api-sdk';
import {
  type InventoryItemLot,
  StockAdjustmentStatusValues,
  StockAdjustmentTypeValues,
} from '@/db/schema';
import { StockAdjustmentLotDto } from '../dto/entity/stock-adjustment-lot.dto';
import type { StockAdjustmentTreeNode } from '../dto/entity/stock-adjustment-tree.dto';
import { StockAdjustmentLotsRepository } from '../repositories/stock-adjustment-lots.repository';

@Injectable()
export class StockAdjustmentLotsService {
  private readonly logger = new Logger(StockAdjustmentLotsService.name);

  constructor(
    private readonly repository: StockAdjustmentLotsRepository,
    private readonly linesRepository: StockAdjustmentLinesRepository,
    private readonly adjustmentsRepository: StockAdjustmentsRepository,
    private readonly inventoryLotsRepository: InventoryItemLotsRepository,
  ) {}

  async listByAdjustment(adjustmentId: string): Promise<StockAdjustmentLotDto[]> {
    await this.ensureAdjustment(adjustmentId);
    const rows = await this.repository.findByAdjustmentId(adjustmentId);
    return rows.map(StockAdjustmentLotDto.from);
  }

  // Returns lots with their lines as nested children — for the OPENING+serial tree UI.
  async findTreeForAdjustment(adjustmentId: string): Promise<StockAdjustmentTreeNode[]> {
    await this.ensureAdjustment(adjustmentId);
    const [lots, lines] = await Promise.all([
      this.repository.findByAdjustmentId(adjustmentId),
      this.linesRepository.findByAdjustmentId(adjustmentId),
    ]);
    const linesByLot = new Map<string, typeof lines>();
    for (const line of lines) {
      const key = line.stockAdjustmentLotId;
      if (!key) continue;
      const bucket = linesByLot.get(key) ?? [];
      bucket.push(line);
      linesByLot.set(key, bucket);
    }
    return lots.map((lot) => ({
      id: lot.id,
      name: lot.lotNumber,
      path: [lot.id],
      kind: 'lot' as const,
      totalQuantity: Number(lot.totalQuantity),
      linesCount: Number(lot.linesCount),
      isBalanced: Number(lot.unbalancedLinesCount) === 0,
      children: (linesByLot.get(lot.id) ?? []).map((line) => ({
        id: line.id,
        name: line.locationName ?? line.locationId ?? '—',
        path: [lot.id, line.id],
        kind: 'line' as const,
        quantity: Number(line.quantity),
        lineItemsCount: line.lineItemsCount,
        isBalanced: line.isBalanced,
      })),
    }));
  }

  async addLot(
    adjustmentId: string,
    data: { lotNumber: string; manufacturingDate?: string | null; expiryDate?: string | null },
  ): Promise<CreateResponseDto<StockAdjustmentLotDto>> {
    const adjustment = await this.ensureAdjustment(adjustmentId);
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Lots can only be added to DRAFT adjustments.');
    }
    if (adjustment.type !== StockAdjustmentTypeValues.OPENING_STOCK) {
      throw new BadRequestException('Lots are only allowed on OPENING_STOCK adjustments.');
    }
    if (adjustment.inventoryItemTracking === 'quantity' || adjustment.inventoryItemTracking === 'serial') {
      throw new BadRequestException(`Items with tracking=${adjustment.inventoryItemTracking} cannot have lots.`);
    }

    const lotNumber = data.lotNumber?.trim();
    if (!lotNumber) {
      throw new ValidationException({
        detail: 'Lot number is required.',
        errors: [{ field: 'lotNumber', message: 'Lot number is required.' }],
      });
    }

    // Reject duplicates within this adjustment (DB also enforces via unique constraint, but we want a clean error)
    const existing = await this.repository.findByAdjustmentIdAndNumber(adjustmentId, lotNumber);
    if (existing) {
      throw new ValidationException({
        detail: `Lot "${lotNumber}" is already on this adjustment.`,
        errors: [{ field: 'lotNumber', message: 'Lot already added to this adjustment.' }],
      });
    }

    // Reject if a lot with the same number already exists in inventory for this item (OPENING_STOCK creates new lots only)
    const inventoryLot = await this.inventoryLotsRepository.findByItemAndNumber(adjustment.inventoryItemId, lotNumber);
    if (inventoryLot) {
      throw new ValidationException({
        detail: `Lot "${lotNumber}" already exists in inventory. OPENING_STOCK can only register new lots.`,
        errors: [{ field: 'lotNumber', message: 'Lot already exists in inventory.' }],
      });
    }

    const created = await this.repository.create({
      stockAdjustmentId: adjustmentId,
      lotNumber,
      manufacturingDate: data.manufacturingDate ?? null,
      expiryDate: data.expiryDate ?? null,
    });

    this.logger.log(`Added lot ${lotNumber} to adjustment ${adjustmentId}`);

    const rowsWithStats = await this.repository.findByAdjustmentId(adjustmentId);
    const refreshed = rowsWithStats.find((r) => r.id === created.id);
    if (!refreshed) throw new NotFoundException('Lot not found after creation.');

    return {
      success: true,
      message: `Lot "${lotNumber}" added successfully.`,
      data: StockAdjustmentLotDto.from(refreshed),
    };
  }

  async updateLot(
    adjustmentId: string,
    lotId: string,
    data: { lotNumber?: string; manufacturingDate?: string | null; expiryDate?: string | null },
  ): Promise<StockAdjustmentLotDto> {
    const adjustment = await this.ensureAdjustment(adjustmentId);
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Lots can only be updated on DRAFT adjustments.');
    }

    const existing = await this.ensureLotBelongsToAdjustment(adjustmentId, lotId);

    if (data.lotNumber !== undefined && data.lotNumber !== existing.lotNumber) {
      const trimmed = data.lotNumber.trim();
      if (!trimmed) {
        throw new ValidationException({
          detail: 'Lot number cannot be empty.',
          errors: [{ field: 'lotNumber', message: 'Lot number is required.' }],
        });
      }
      const dup = await this.repository.findByAdjustmentIdAndNumber(adjustmentId, trimmed);
      if (dup && dup.id !== lotId) {
        throw new ValidationException({
          detail: `Lot "${trimmed}" is already on this adjustment.`,
          errors: [{ field: 'lotNumber', message: 'Lot already on this adjustment.' }],
        });
      }
      const inventoryDup = await this.inventoryLotsRepository.findByItemAndNumber(
        adjustment.inventoryItemId,
        trimmed,
      );
      if (inventoryDup) {
        throw new ValidationException({
          detail: `Lot "${trimmed}" already exists in inventory.`,
          errors: [{ field: 'lotNumber', message: 'Lot already exists in inventory.' }],
        });
      }
    }

    await this.repository.update(lotId, {
      ...(data.lotNumber !== undefined ? { lotNumber: data.lotNumber.trim() } : {}),
      ...(data.manufacturingDate !== undefined ? { manufacturingDate: data.manufacturingDate ?? null } : {}),
      ...(data.expiryDate !== undefined ? { expiryDate: data.expiryDate ?? null } : {}),
    });

    const rowsWithStats = await this.repository.findByAdjustmentId(adjustmentId);
    const refreshed = rowsWithStats.find((r) => r.id === lotId);
    if (!refreshed) throw new NotFoundException('Lot not found after update.');
    return StockAdjustmentLotDto.from(refreshed);
  }

  async removeLot(adjustmentId: string, lotId: string): Promise<SuccessResponseDto> {
    const adjustment = await this.ensureAdjustment(adjustmentId);
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Lots can only be removed from DRAFT adjustments.');
    }
    const existing = await this.ensureLotBelongsToAdjustment(adjustmentId, lotId);
    await this.repository.delete(lotId);
    this.logger.log(`Removed lot ${existing.lotNumber} from adjustment ${adjustmentId}`);
    return { success: true, message: `Lot "${existing.lotNumber}" removed successfully.` };
  }

  // Used by the publish flow: creates the matching inventory_item_lots row from this draft lot.
  // Throws if a lot with the same (item, number) already exists in inventory (cannot reuse).
  async resolveInventoryLotInTx(
    tx: TypedDrizzleClient,
    inventoryItemId: string,
    lotId: string,
  ): Promise<InventoryItemLot> {
    const sa = await this.repository.findById(lotId);
    if (!sa) throw new NotFoundException(`Stock adjustment lot ${lotId} not found.`);
    // Use the inventoryLotsRepository.createWithTx via its in-tx insert
    const inserted = await this.inventoryLotsRepository.createWithTx(tx, {
      inventoryItemId,
      lotNumber: sa.lotNumber,
      manufacturingDate: sa.manufacturingDate ?? null,
      expiryDate: sa.expiryDate ?? null,
    });
    await this.repository.setResolvedLotIdInTx(tx, lotId, inserted.id);
    return inserted;
  }

  private async ensureAdjustment(adjustmentId: string) {
    const adjustment = await this.adjustmentsRepository.findByIdWithItemName(adjustmentId);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    return adjustment;
  }

  private async ensureLotBelongsToAdjustment(adjustmentId: string, lotId: string) {
    const lot = await this.repository.findById(lotId);
    if (!lot || lot.stockAdjustmentId !== adjustmentId) {
      throw new NotFoundException('Stock adjustment lot not found.');
    }
    return lot;
  }
}
