import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  NotFoundException,
  type SuccessResponseDto,
  ValidationException,
} from '@vritti/api-sdk';
import {
  type InventoryTracking,
  InventoryTrackingValues,
  type StockAdjustmentStatus,
  StockAdjustmentStatusValues,
  type StockAdjustmentType,
  StockAdjustmentTypeValues,
} from '@/db/schema';
import { StockAdjustmentLotDto } from '../dto/entity/stock-adjustment-lot.dto';
import { StockAdjustmentLotDetailDto } from '../dto/entity/stock-adjustment-lot-detail.dto';
import type { StockAdjustmentTreeNode } from '../dto/entity/stock-adjustment-tree.dto';
import { StockAdjustmentLotsRepository } from '../repositories/stock-adjustment-lots.repository';

// Minimal adjustment shape required by write methods — passed in from app-layer
interface AdjustmentContext {
  id: string;
  status: StockAdjustmentStatus;
  type: StockAdjustmentType;
  inventoryItemTracking: InventoryTracking;
}

@Injectable()
export class StockAdjustmentLotsService {
  private readonly logger = new Logger(StockAdjustmentLotsService.name);

  constructor(private readonly repository: StockAdjustmentLotsRepository) {}

  // Lists all lots for an adjustment — existence check is the app-layer's responsibility
  async listByAdjustment(adjustmentId: string): Promise<StockAdjustmentLotDto[]> {
    const rows = await this.repository.findByAdjustmentId(adjustmentId);
    return rows.map(StockAdjustmentLotDto.from);
  }

  // Returns a single lot's detail (stats + already-used location ids + line ids).
  // Used by the FE when a lot is selected to drive the AddLine excludeIds and the lot header.
  async getLotDetail(adjustmentId: string, lotId: string): Promise<StockAdjustmentLotDetailDto> {
    const row = await this.repository.findLotDetail(lotId);
    if (!row || row.stockAdjustmentId !== adjustmentId) {
      throw new NotFoundException('Stock adjustment lot not found.');
    }
    return StockAdjustmentLotDetailDto.from(row);
  }

  // Returns lots with their lines as nested children — for the OPENING+serial tree UI.
  async findTreeForAdjustment(adjustmentId: string): Promise<StockAdjustmentTreeNode[]> {
    return this.repository.findTreeNodesByAdjustmentId(adjustmentId);
  }

  async addLot(
    adjustment: AdjustmentContext,
    data: { lotNumber: string; manufacturingDate?: string | null; expiryDate: string; mrp?: bigint | null },
  ): Promise<CreateResponseDto<StockAdjustmentLotDto>> {
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Lots can only be added to DRAFT adjustments.');
    }
    if (adjustment.type !== StockAdjustmentTypeValues.OPENING_STOCK) {
      throw new BadRequestException('Lots are only allowed on OPENING_STOCK adjustments.');
    }
    if (
      adjustment.inventoryItemTracking === InventoryTrackingValues.QUANTITY ||
      adjustment.inventoryItemTracking === InventoryTrackingValues.SERIAL
    ) {
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
    const existing = await this.repository.findByAdjustmentIdAndNumber(adjustment.id, lotNumber);
    if (existing) {
      throw new ValidationException({
        detail: `Lot "${lotNumber}" is already on this adjustment.`,
        errors: [{ field: 'lotNumber', message: 'Lot already added to this adjustment.' }],
      });
    }

    this.validateDateOrder(data.manufacturingDate ?? null, data.expiryDate);

    const created = await this.repository.create({
      stockAdjustmentId: adjustment.id,
      lotNumber,
      manufacturingDate: data.manufacturingDate ?? null,
      expiryDate: data.expiryDate,
      mrp: data.mrp ?? null,
    });

    this.logger.log(`Added lot ${lotNumber} to adjustment ${adjustment.id}`);

    const rowsWithStats = await this.repository.findByAdjustmentId(adjustment.id);
    const refreshed = rowsWithStats.find((r) => r.id === created.id);
    if (!refreshed) throw new NotFoundException('Lot not found after creation.');

    return {
      success: true,
      message: `Lot "${lotNumber}" added successfully.`,
      data: StockAdjustmentLotDto.from(refreshed),
    };
  }

  async updateLot(
    adjustment: { id: string; status: StockAdjustmentStatus },
    lotId: string,
    data: { lotNumber?: string; manufacturingDate?: string | null; expiryDate?: string; mrp?: bigint | null },
  ): Promise<StockAdjustmentLotDto> {
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Lots can only be updated on DRAFT adjustments.');
    }

    const existing = await this.ensureLotBelongsToAdjustment(adjustment.id, lotId);

    if (data.lotNumber !== undefined && data.lotNumber !== existing.lotNumber) {
      const trimmed = data.lotNumber.trim();
      if (!trimmed) {
        throw new ValidationException({
          detail: 'Lot number cannot be empty.',
          errors: [{ field: 'lotNumber', message: 'Lot number is required.' }],
        });
      }
      const dup = await this.repository.findByAdjustmentIdAndNumber(adjustment.id, trimmed);
      if (dup && dup.id !== lotId) {
        throw new ValidationException({
          detail: `Lot "${trimmed}" is already on this adjustment.`,
          errors: [{ field: 'lotNumber', message: 'Lot already on this adjustment.' }],
        });
      }
    }

    const effectiveMfgDate = data.manufacturingDate !== undefined ? data.manufacturingDate : existing.manufacturingDate;
    const effectiveExpiryDate = data.expiryDate !== undefined ? data.expiryDate : existing.expiryDate;
    this.validateDateOrder(effectiveMfgDate, effectiveExpiryDate);

    await this.repository.update(lotId, {
      ...(data.lotNumber !== undefined ? { lotNumber: data.lotNumber.trim() } : {}),
      ...(data.manufacturingDate !== undefined ? { manufacturingDate: data.manufacturingDate ?? null } : {}),
      ...(data.expiryDate !== undefined ? { expiryDate: data.expiryDate } : {}),
      ...(data.mrp !== undefined ? { mrp: data.mrp } : {}),
    });

    const rowsWithStats = await this.repository.findByAdjustmentId(adjustment.id);
    const refreshed = rowsWithStats.find((r) => r.id === lotId);
    if (!refreshed) throw new NotFoundException('Lot not found after update.');
    return StockAdjustmentLotDto.from(refreshed);
  }

  async removeLot(
    adjustment: { id: string; status: StockAdjustmentStatus },
    lotId: string,
  ): Promise<SuccessResponseDto> {
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Lots can only be deleted from DRAFT adjustments.');
    }
    const existing = await this.ensureLotBelongsToAdjustment(adjustment.id, lotId);
    await this.repository.delete(lotId);
    this.logger.log(`Deleted lot ${existing.lotNumber} from adjustment ${adjustment.id}`);
    return { success: true, message: `Lot "${existing.lotNumber}" deleted successfully.` };
  }

  private async ensureLotBelongsToAdjustment(adjustmentId: string, lotId: string) {
    const lot = await this.repository.findById(lotId);
    if (!lot || lot.stockAdjustmentId !== adjustmentId) {
      throw new NotFoundException('Stock adjustment lot not found.');
    }
    return lot;
  }

  private validateDateOrder(manufacturingDate: string | null | undefined, expiryDate: string): void {
    if (!manufacturingDate) return;
    if (new Date(expiryDate) <= new Date(manufacturingDate)) {
      throw new ValidationException({
        detail: 'Expiry date must be after manufacturing date.',
        errors: [{ field: 'expiryDate', message: 'Expiry date must be after manufacturing date.' }],
      });
    }
  }
}
