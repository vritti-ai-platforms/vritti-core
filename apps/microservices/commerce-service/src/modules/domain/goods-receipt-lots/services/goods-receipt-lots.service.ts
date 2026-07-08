import { GoodsReceiptItemsService } from '@domain/goods-receipts/services/goods-receipt-items.service';
import { GoodsReceiptsService } from '@domain/goods-receipts/services/goods-receipts.service';
import { InventoryItemLotsService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import { Injectable, Logger } from '@nestjs/common';
import { type CreateResponseDto, PrimaryDatabaseService, type SuccessResponseDto } from '@vritti/api-sdk/database';
import { BadRequestException, NotFoundException, ValidationException } from '@vritti/api-sdk/exceptions';
import { GoodsReceiptStatusValues, type InventoryItemLot, InventoryTrackingValues } from '@/db/schema';
import { GoodsReceiptLotDto } from '../dto/entity/goods-receipt-lot.dto';
import { GoodsReceiptLotsRepository } from '../repositories/goods-receipt-lots.repository';

@Injectable()
export class GoodsReceiptLotsService {
  private readonly logger = new Logger(GoodsReceiptLotsService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly repository: GoodsReceiptLotsRepository,
    private readonly itemsService: GoodsReceiptItemsService,
    private readonly receiptsService: GoodsReceiptsService,
    private readonly inventoryItemLotsService: InventoryItemLotsService,
  ) {}

  async listByItem(goodsReceiptId: string, itemId: string, buCurrencyCode?: string): Promise<GoodsReceiptLotDto[]> {
    await this.ensureItem(goodsReceiptId, itemId);
    const rows = await this.repository.findByItemId(itemId);
    return rows.map((row) => GoodsReceiptLotDto.from(row, buCurrencyCode));
  }

  async addLot(
    goodsReceiptId: string,
    itemId: string,
    data: { lotNumber: string; manufacturingDate?: string | null; expiryDate: string; mrp?: bigint | null },
    buCurrencyCode?: string,
  ): Promise<CreateResponseDto<GoodsReceiptLotDto>> {
    const { receipt, item } = await this.ensureItem(goodsReceiptId, itemId);
    if (receipt.status !== GoodsReceiptStatusValues.DRAFT) {
      throw new BadRequestException('Lots can only be added to DRAFT goods receipts.');
    }
    if (
      item.inventoryItemTracking === InventoryTrackingValues.QUANTITY ||
      item.inventoryItemTracking === InventoryTrackingValues.SERIAL
    ) {
      throw new BadRequestException(`Items with tracking=${item.inventoryItemTracking} cannot have lots.`);
    }

    const lotNumber = data.lotNumber?.trim();
    if (!lotNumber) {
      throw new ValidationException({
        detail: 'Lot number is required.',
        errors: [{ field: 'lotNumber', message: 'Lot number is required.' }],
      });
    }

    const existing = await this.repository.findByItemIdAndNumber(itemId, lotNumber);
    if (existing) {
      throw new ValidationException({
        detail: `Lot "${lotNumber}" is already on this item.`,
        errors: [{ field: 'lotNumber', message: 'Lot already added to this item.' }],
      });
    }

    const inventoryLot = await this.inventoryItemLotsService.findByItemAndNumber(item.inventoryItemId, lotNumber);
    if (inventoryLot) {
      throw new ValidationException({
        detail: `Lot "${lotNumber}" already exists in inventory. Goods receipts can only register new lots.`,
        errors: [{ field: 'lotNumber', message: 'Lot already exists in inventory.' }],
      });
    }

    const created = await this.repository.create({
      goodsReceiptItemId: itemId,
      lotNumber,
      manufacturingDate: data.manufacturingDate ?? null,
      expiryDate: data.expiryDate,
      mrp: data.mrp ?? null,
    });

    this.logger.log(`Added lot ${lotNumber} to goods-receipt-item ${itemId}`);

    const refreshed = (await this.repository.findByItemId(itemId)).find((r) => r.id === created.id);
    if (!refreshed) throw new NotFoundException('Lot not found after creation.');

    return {
      success: true,
      message: `Lot "${lotNumber}" added successfully.`,
      data: GoodsReceiptLotDto.from(refreshed, buCurrencyCode),
    };
  }

  async updateLot(
    goodsReceiptId: string,
    itemId: string,
    lotId: string,
    data: { lotNumber?: string; manufacturingDate?: string | null; expiryDate?: string; mrp?: bigint | null },
    buCurrencyCode?: string,
  ): Promise<GoodsReceiptLotDto> {
    const { receipt, item } = await this.ensureItem(goodsReceiptId, itemId);
    if (receipt.status !== GoodsReceiptStatusValues.DRAFT) {
      throw new BadRequestException('Lots can only be updated on DRAFT goods receipts.');
    }
    const existing = await this.ensureLotBelongsToItem(itemId, lotId);

    if (data.lotNumber !== undefined && data.lotNumber !== existing.lotNumber) {
      const trimmed = data.lotNumber.trim();
      if (!trimmed) {
        throw new ValidationException({
          detail: 'Lot number cannot be empty.',
          errors: [{ field: 'lotNumber', message: 'Lot number is required.' }],
        });
      }
      const dup = await this.repository.findByItemIdAndNumber(itemId, trimmed);
      if (dup && dup.id !== lotId) {
        throw new ValidationException({
          detail: `Lot "${trimmed}" is already on this item.`,
          errors: [{ field: 'lotNumber', message: 'Lot already on this item.' }],
        });
      }
      const inventoryDup = await this.inventoryItemLotsService.findByItemAndNumber(item.inventoryItemId, trimmed);
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
      ...(data.expiryDate !== undefined ? { expiryDate: data.expiryDate } : {}),
      ...(data.mrp !== undefined ? { mrp: data.mrp } : {}),
    });

    const refreshed = (await this.repository.findByItemId(itemId)).find((r) => r.id === lotId);
    if (!refreshed) throw new NotFoundException('Lot not found after update.');
    return GoodsReceiptLotDto.from(refreshed, buCurrencyCode);
  }

  async removeLot(goodsReceiptId: string, itemId: string, lotId: string): Promise<SuccessResponseDto> {
    const { receipt } = await this.ensureItem(goodsReceiptId, itemId);
    if (receipt.status !== GoodsReceiptStatusValues.DRAFT) {
      throw new BadRequestException('Lots can only be removed from DRAFT goods receipts.');
    }
    const existing = await this.ensureLotBelongsToItem(itemId, lotId);
    await this.repository.delete(lotId);
    this.logger.log(`Removed lot ${existing.lotNumber} from goods-receipt-item ${itemId}`);
    return { success: true, message: `Lot "${existing.lotNumber}" removed successfully.` };
  }

  // Used by the publish flow: creates the matching inventory_item_lots row from this draft lot.
  async resolveInventoryLot(inventoryItemId: string, lotId: string): Promise<InventoryItemLot> {
    const gr = await this.repository.findById(lotId);
    if (!gr) throw new NotFoundException(`Goods receipt lot ${lotId} not found.`);
    if (!gr.expiryDate) {
      throw new BadRequestException(`Goods receipt lot ${lotId} is missing an expiry date.`);
    }
    return this.database.runInTransaction(async () => {
      const inserted = await this.inventoryItemLotsService.createLot({
        inventoryItemId,
        lotNumber: gr.lotNumber,
        manufacturingDate: gr.manufacturingDate ?? null,
        expiryDate: gr.expiryDate,
      });
      await this.repository.setResolvedLotId(lotId, inserted.id);
      return inserted;
    });
  }

  // Validates the receipt and item exist and returns both for downstream guards
  private async ensureItem(goodsReceiptId: string, itemId: string) {
    const receipt = await this.receiptsService.findById(goodsReceiptId);
    const item = await this.itemsService.findById(goodsReceiptId, itemId);
    return { receipt, item };
  }

  private async ensureLotBelongsToItem(itemId: string, lotId: string) {
    const lot = await this.repository.findById(lotId);
    if (!lot || lot.goodsReceiptItemId !== itemId) {
      throw new NotFoundException('Goods receipt lot not found.');
    }
    return lot;
  }
}
