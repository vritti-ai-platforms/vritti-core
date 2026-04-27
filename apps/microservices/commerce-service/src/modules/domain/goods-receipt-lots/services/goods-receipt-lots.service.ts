import { GoodsReceiptItemsRepository } from '@domain/goods-receipts/repositories/goods-receipt-items.repository';
import { GoodsReceiptsRepository } from '@domain/goods-receipts/repositories/goods-receipts.repository';
import { GoodsReceiptLinesRepository } from '@domain/goods-receipt-lines/repositories/goods-receipt-lines.repository';
import { InventoryItemLotsRepository } from '@domain/inventory-item-lots/repositories/inventory-item-lots.repository';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  NotFoundException,
  type SuccessResponseDto,
  type TypedDrizzleClient,
  ValidationException,
} from '@vritti/api-sdk';
import { GoodsReceiptStatusValues, type InventoryItemLot, InventoryTrackingValues } from '@/db/schema';
import { GoodsReceiptLotDto } from '../dto/entity/goods-receipt-lot.dto';
import type { GoodsReceiptTreeNode } from '../dto/entity/goods-receipt-tree.dto';
import { GoodsReceiptLotsRepository } from '../repositories/goods-receipt-lots.repository';

@Injectable()
export class GoodsReceiptLotsService {
  private readonly logger = new Logger(GoodsReceiptLotsService.name);

  constructor(
    private readonly repository: GoodsReceiptLotsRepository,
    private readonly linesRepository: GoodsReceiptLinesRepository,
    private readonly itemsRepository: GoodsReceiptItemsRepository,
    private readonly receiptsRepository: GoodsReceiptsRepository,
    private readonly inventoryLotsRepository: InventoryItemLotsRepository,
  ) {}

  async listByItem(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptLotDto[]> {
    await this.ensureItem(goodsReceiptId, itemId);
    const rows = await this.repository.findByItemId(itemId);
    return rows.map(GoodsReceiptLotDto.from);
  }

  // Builds the unified tree: items as roots, lots/lines as descendants based on item.tracking.
  // tracking='quantity': item is a leaf.
  // tracking='lot': item -> lots (lots are leaves).
  // tracking='serial': item -> lots -> lines (lines are leaves).
  async findTreeForReceipt(goodsReceiptId: string): Promise<GoodsReceiptTreeNode[]> {
    const receipt = await this.receiptsRepository.findById(goodsReceiptId);
    if (!receipt) throw new NotFoundException('Goods receipt not found.');

    const items = await this.itemsRepository.findByReceiptId(goodsReceiptId);
    if (items.length === 0) return [];

    const lotsByItem = new Map<string, Awaited<ReturnType<typeof this.repository.findByItemId>>>();
    for (const item of items) {
      if (item.inventoryItemTracking === InventoryTrackingValues.QUANTITY) continue;
      lotsByItem.set(item.id, await this.repository.findByItemId(item.id));
    }

    const linesByLot = new Map<string, Awaited<ReturnType<typeof this.linesRepository.findByItemId>>>();
    for (const item of items) {
      if (item.inventoryItemTracking !== InventoryTrackingValues.SERIAL) continue;
      const lines = await this.linesRepository.findByItemId(item.id);
      for (const line of lines) {
        const lotId = line.goodsReceiptLotId;
        if (!lotId) continue;
        const bucket = linesByLot.get(lotId) ?? [];
        bucket.push(line);
        linesByLot.set(lotId, bucket);
      }
    }

    return items.map((item): GoodsReceiptTreeNode => {
      const tracking = item.inventoryItemTracking;
      const itemNode: GoodsReceiptTreeNode = {
        id: item.id,
        name: item.inventoryItemName ?? item.inventoryItemId,
        path: [item.id],
        kind: 'item',
        inventoryItemTracking: tracking,
        inventoryItemUomSymbol: item.inventoryItemUomSymbol ?? undefined,
        acceptedQuantity: Number(item.acceptedQuantity),
        rejectedQuantity: Number(item.rejectedQuantity),
        poOrderedQuantity: item.poOrderedQuantity != null ? Number(item.poOrderedQuantity) : null,
        poReceivedQuantity: item.poReceivedQuantity != null ? Number(item.poReceivedQuantity) : null,
        poRemainingQuantity:
          item.poOrderedQuantity != null
            ? Number(item.poOrderedQuantity) - Number(item.poReceivedQuantity ?? 0)
            : null,
        isBalanced: item.unbalancedLinesCount === 0,
      };
      if (tracking === InventoryTrackingValues.QUANTITY) {
        return itemNode;
      }
      const lots = lotsByItem.get(item.id) ?? [];
      itemNode.children = lots.map((lot): GoodsReceiptTreeNode => {
        const lotNode: GoodsReceiptTreeNode = {
          id: lot.id,
          name: lot.lotNumber,
          path: [item.id, lot.id],
          kind: 'lot',
          totalQuantity: Number(lot.totalQuantity),
          linesCount: Number(lot.linesCount),
          isBalanced: Number(lot.unbalancedLinesCount) === 0,
        };
        if (tracking === InventoryTrackingValues.SERIAL) {
          lotNode.children = (linesByLot.get(lot.id) ?? []).map((line) => ({
            id: line.id,
            name: line.locationName ?? line.locationId ?? '—',
            path: [item.id, lot.id, line.id],
            kind: 'line' as const,
            quantity: Number(line.quantity),
            lineItemsCount: line.lineItemsCount,
            isBalanced: line.isBalanced,
          }));
        }
        return lotNode;
      });
      return itemNode;
    });
  }

  async addLot(
    goodsReceiptId: string,
    itemId: string,
    data: { lotNumber: string; manufacturingDate?: string | null; expiryDate?: string | null },
  ): Promise<CreateResponseDto<GoodsReceiptLotDto>> {
    const { receipt, item, tracking } = await this.ensureItem(goodsReceiptId, itemId);
    if (receipt.status !== GoodsReceiptStatusValues.DRAFT) {
      throw new BadRequestException('Lots can only be added to DRAFT goods receipts.');
    }
    if (tracking === InventoryTrackingValues.QUANTITY) {
      throw new BadRequestException('Items with tracking=quantity cannot have lots.');
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

    const inventoryLot = await this.inventoryLotsRepository.findByItemAndNumber(item.inventoryItemId, lotNumber);
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
      expiryDate: data.expiryDate ?? null,
    });

    this.logger.log(`Added lot ${lotNumber} to goods-receipt-item ${itemId}`);

    const refreshed = (await this.repository.findByItemId(itemId)).find((r) => r.id === created.id);
    if (!refreshed) throw new NotFoundException('Lot not found after creation.');

    return {
      success: true,
      message: `Lot "${lotNumber}" added successfully.`,
      data: GoodsReceiptLotDto.from(refreshed),
    };
  }

  async updateLot(
    goodsReceiptId: string,
    itemId: string,
    lotId: string,
    data: { lotNumber?: string; manufacturingDate?: string | null; expiryDate?: string | null },
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
      const inventoryDup = await this.inventoryLotsRepository.findByItemAndNumber(item.inventoryItemId, trimmed);
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

    const refreshed = (await this.repository.findByItemId(itemId)).find((r) => r.id === lotId);
    if (!refreshed) throw new NotFoundException('Lot not found after update.');
    return GoodsReceiptLotDto.from(refreshed);
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
  async resolveInventoryLotInTx(
    tx: TypedDrizzleClient,
    inventoryItemId: string,
    lotId: string,
  ): Promise<InventoryItemLot> {
    const gr = await this.repository.findById(lotId);
    if (!gr) throw new NotFoundException(`Goods receipt lot ${lotId} not found.`);
    const inserted = await this.inventoryLotsRepository.createWithTx(tx, {
      inventoryItemId,
      lotNumber: gr.lotNumber,
      manufacturingDate: gr.manufacturingDate ?? null,
      expiryDate: gr.expiryDate ?? null,
    });
    await this.repository.setResolvedLotIdInTx(tx, lotId, inserted.id);
    return inserted;
  }

  private async ensureItem(goodsReceiptId: string, itemId: string) {
    const receipt = await this.receiptsRepository.findById(goodsReceiptId);
    if (!receipt) throw new NotFoundException('Goods receipt not found.');
    const item = await this.itemsRepository.findByReceiptIdAndItemId(goodsReceiptId, itemId);
    if (!item) throw new NotFoundException('Goods receipt item not found.');
    const tracking = await this.itemsRepository.getTrackingForItem(itemId);
    if (!tracking) throw new NotFoundException('Inventory item tracking not found.');
    return { receipt, item, tracking };
  }

  private async ensureLotBelongsToItem(itemId: string, lotId: string) {
    const lot = await this.repository.findById(lotId);
    if (!lot || lot.goodsReceiptItemId !== itemId) {
      throw new NotFoundException('Goods receipt lot not found.');
    }
    return lot;
  }
}
