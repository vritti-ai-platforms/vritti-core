import { GoodsReceiptLotsRepository } from '@domain/goods-receipt-lots/repositories/goods-receipt-lots.repository';
import { GoodsReceiptItemsRepository } from '@domain/goods-receipts/repositories/goods-receipt-items.repository';
import { GoodsReceiptsRepository } from '@domain/goods-receipts/repositories/goods-receipts.repository';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState,
  ValidationException,
} from '@vritti/api-sdk';
import { and } from '@vritti/api-sdk/drizzle-orm';
import {
  GoodsReceiptStatusValues,
  goodsReceiptLines,
  type InventoryTracking,
  InventoryTrackingValues,
  locations,
} from '@/db/schema';
import { GoodsReceiptLineDto } from '../dto/entity/goods-receipt-line.dto';
import { GoodsReceiptLinesRepository } from '../repositories/goods-receipt-lines.repository';

interface ItemContext {
  goodsReceiptId: string;
  itemId: string;
  inventoryItemId: string;
  tracking: InventoryTracking;
  poItemId: string | null;
  poOrderedQuantity: number | null;
  poReceivedQuantity: number | null;
}

@Injectable()
export class GoodsReceiptLinesService {
  private readonly logger = new Logger(GoodsReceiptLinesService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    locationName: { column: locations.name, type: 'string' },
    locationPath: { column: locations.pathBreadcrumb, type: 'string' },
  };

  private static readonly FILTER_FIELD_MAP: FieldMap = {
    quantity: { column: goodsReceiptLines.quantity, type: 'number' },
  };

  constructor(
    private readonly repository: GoodsReceiptLinesRepository,
    private readonly itemsRepository: GoodsReceiptItemsRepository,
    private readonly receiptsRepository: GoodsReceiptsRepository,
    private readonly lotsRepository: GoodsReceiptLotsRepository,
  ) {}

  async findForTable(
    goodsReceiptId: string,
    itemId: string,
    state: TableViewState,
    lotId?: string | null,
  ): Promise<{ result: GoodsReceiptLineDto[]; count: number }> {
    await this.ensureItemBelongsToReceipt(goodsReceiptId, itemId);
    const filterWhere = FilterProcessor.buildWhere(state.filters, GoodsReceiptLinesService.FILTER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, GoodsReceiptLinesService.SEARCH_FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const { limit = 20, offset = 0 } = state.pagination;
    const { result, count } = await this.repository.findForTable(itemId, {
      where,
      orderBy: FilterProcessor.buildOrderBy(state.sort, {
        ...GoodsReceiptLinesService.SEARCH_FIELD_MAP,
        ...GoodsReceiptLinesService.FILTER_FIELD_MAP,
      }),
      limit,
      offset,
      lotId,
    });
    return { result: result.map(GoodsReceiptLineDto.from), count };
  }

  async findByItemId(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptLineDto[]> {
    await this.ensureItemBelongsToReceipt(goodsReceiptId, itemId);
    const rows = await this.repository.findByItemId(itemId);
    return rows.map(GoodsReceiptLineDto.from);
  }

  async findByLotId(goodsReceiptId: string, itemId: string, lotId: string): Promise<GoodsReceiptLineDto[]> {
    await this.ensureItemBelongsToReceipt(goodsReceiptId, itemId);
    const lot = await this.lotsRepository.findById(lotId);
    if (!lot || lot.goodsReceiptItemId !== itemId) {
      throw new NotFoundException('Goods receipt lot not found.');
    }
    const rows = await this.repository.findByLotId(lotId);
    return rows.map(GoodsReceiptLineDto.from);
  }

  async findById(goodsReceiptId: string, itemId: string, lineId: string): Promise<GoodsReceiptLineDto> {
    await this.ensureItemBelongsToReceipt(goodsReceiptId, itemId);
    const line = await this.repository.findByItemIdAndLineId(itemId, lineId);
    if (!line) throw new NotFoundException('Goods receipt line not found.');
    return GoodsReceiptLineDto.from(line);
  }

  async addLine(
    goodsReceiptId: string,
    itemId: string,
    data: { goodsReceiptLotId?: string | null; locationId: string; quantity: number },
  ): Promise<CreateResponseDto<GoodsReceiptLineDto>> {
    const ctx = await this.getItemContext(goodsReceiptId, itemId);
    await this.validateIntent(ctx, data);

    const isSerial =
      ctx.tracking === InventoryTrackingValues.SERIAL || ctx.tracking === InventoryTrackingValues.LOT_SERIAL;
    if (!Number.isFinite(data.quantity) || data.quantity < 0 || (data.quantity === 0 && !isSerial)) {
      throw new ValidationException({
        detail: 'Quantity must be a positive number.',
        errors: [{ field: 'quantity', message: 'Quantity is required.' }],
      });
    }

    if (!isSerial) {
      await this.validatePoCap(ctx, data.quantity);
    }

    // Reject a duplicate (item, lot?, location) line
    const duplicate = await this.repository.findOneByItemLotLocation({
      itemId,
      goodsReceiptLotId: data.goodsReceiptLotId ?? null,
      locationId: data.locationId,
    });
    if (duplicate) {
      throw new ValidationException({
        label: 'Duplicate Line',
        detail: 'A line for this location already exists on this item. Edit that line instead.',
        errors: [{ field: 'locationId', message: 'Already used for this item.' }],
      });
    }

    // 23505 race fallback handled globally by api-sdk's pg-error filter.
    const created = await this.repository.create({
      goodsReceiptItemId: itemId,
      goodsReceiptLotId: data.goodsReceiptLotId ?? null,
      locationId: data.locationId,
      quantity: data.quantity,
    });

    // Recompute is_balanced for the new line
    await this.repository.refreshIsBalanced(created.id, ctx.tracking);

    this.logger.log(`Added line ${created.id} to goods-receipt-item ${itemId}`);
    const refreshed = await this.repository.findByItemIdAndLineId(itemId, created.id);
    if (!refreshed) throw new NotFoundException('Line not found after insert.');
    return {
      success: true,
      message: 'Line added successfully.',
      data: GoodsReceiptLineDto.from(refreshed),
    };
  }

  async updateLine(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    data: { goodsReceiptLotId?: string | null; locationId?: string; quantity?: number },
  ): Promise<GoodsReceiptLineDto> {
    const ctx = await this.getItemContext(goodsReceiptId, itemId);
    const line = await this.repository.findById(lineId);
    if (!line || line.goodsReceiptItemId !== itemId) throw new NotFoundException('Goods receipt line not found.');

    const next = {
      goodsReceiptLotId: data.goodsReceiptLotId !== undefined ? data.goodsReceiptLotId : line.goodsReceiptLotId,
      locationId: data.locationId !== undefined ? data.locationId : line.locationId,
      quantity: data.quantity !== undefined ? data.quantity : line.quantity,
    };
    await this.validateIntent(ctx, next);

    const isSerial =
      ctx.tracking === InventoryTrackingValues.SERIAL || ctx.tracking === InventoryTrackingValues.LOT_SERIAL;
    if (!isSerial && data.quantity !== undefined) {
      // PO cap re-check using the new quantity (excluding this line's existing contribution)
      await this.validatePoCap(ctx, data.quantity, lineId);
    }

    // Re-check the duplicate guard when lot or location changed, excluding this line
    if (data.goodsReceiptLotId !== undefined || data.locationId !== undefined) {
      const duplicate = await this.repository.findOneByItemLotLocation({
        itemId,
        goodsReceiptLotId: next.goodsReceiptLotId ?? null,
        locationId: next.locationId,
        excludeLineId: lineId,
      });
      if (duplicate) {
        throw new ValidationException({
          label: 'Duplicate Line',
          detail: 'A line for this location already exists on this item. Edit that line instead.',
          errors: [{ field: 'locationId', message: 'Already used for this item.' }],
        });
      }
    }

    await this.repository.update(lineId, {
      ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
      ...(data.goodsReceiptLotId !== undefined ? { goodsReceiptLotId: data.goodsReceiptLotId } : {}),
      ...(data.locationId !== undefined ? { locationId: data.locationId } : {}),
    });

    await this.repository.refreshIsBalanced(lineId, ctx.tracking);

    const refreshed = await this.repository.findByItemIdAndLineId(itemId, lineId);
    if (!refreshed) throw new NotFoundException('Line not found after update.');
    return GoodsReceiptLineDto.from(refreshed);
  }

  async removeLine(goodsReceiptId: string, itemId: string, lineId: string): Promise<SuccessResponseDto> {
    const ctx = await this.getItemContext(goodsReceiptId, itemId);
    const line = await this.repository.findById(lineId);
    if (!line || line.goodsReceiptItemId !== itemId) throw new NotFoundException('Goods receipt line not found.');
    void ctx;
    await this.repository.deleteLine(lineId);
    this.logger.log(`Removed line ${lineId} from goods-receipt-item ${itemId}`);
    return { success: true, message: 'Line removed successfully.' };
  }

  async refreshIsBalanced(itemId: string, lineId: string, tracking: InventoryTracking): Promise<void> {
    await this.repository.refreshIsBalanced(lineId, tracking);
    void itemId;
  }

  // Validates that the item's total quantity does not exceed the remaining PO quantity
  async validatePoCap(ctx: ItemContext, additionalQuantity: number, excludeLineId?: string): Promise<void> {
    if (!ctx.poItemId || ctx.poOrderedQuantity == null) return;
    const currentSum = await this.repository.totalQuantityForItem(ctx.itemId, excludeLineId);
    const remaining = ctx.poOrderedQuantity - (ctx.poReceivedQuantity ?? 0);
    const total = currentSum + additionalQuantity;
    if (total > remaining + 1e-9) {
      throw new ValidationException({
        detail: `Total quantity ${total} exceeds remaining PO quantity ${remaining}.`,
        errors: [{ field: 'quantity', message: 'Exceeds remaining PO quantity.' }],
      });
    }
  }

  // Validates the line shape against the item's tracking type
  private async validateIntent(
    ctx: ItemContext,
    data: { goodsReceiptLotId?: string | null; locationId?: string },
  ): Promise<void> {
    if (!data.locationId) {
      throw new ValidationException({
        detail: 'Storage location is required for goods-receipt lines.',
        errors: [{ field: 'locationId', message: 'Storage location is required.' }],
      });
    }
    if (ctx.tracking === InventoryTrackingValues.QUANTITY || ctx.tracking === InventoryTrackingValues.SERIAL) {
      if (data.goodsReceiptLotId) {
        throw new ValidationException({
          detail: `Lot must not be set for items with tracking=${ctx.tracking}.`,
          errors: [{ field: 'goodsReceiptLotId', message: `Not allowed for tracking=${ctx.tracking}.` }],
        });
      }
      return;
    }
    if (!data.goodsReceiptLotId) {
      throw new ValidationException({
        detail: 'A lot must be selected for items with tracking=lot or tracking=lot_serial.',
        errors: [{ field: 'goodsReceiptLotId', message: 'Lot is required.' }],
      });
    }
    const lot = await this.lotsRepository.findById(data.goodsReceiptLotId);
    if (!lot || lot.goodsReceiptItemId !== ctx.itemId) {
      throw new ValidationException({
        detail: 'Lot does not belong to this item.',
        errors: [{ field: 'goodsReceiptLotId', message: 'Invalid lot reference.' }],
      });
    }
  }

  async getItemContext(goodsReceiptId: string, itemId: string): Promise<ItemContext> {
    const receipt = await this.receiptsRepository.findById(goodsReceiptId);
    if (!receipt) throw new NotFoundException('Goods receipt not found.');
    if (receipt.status !== GoodsReceiptStatusValues.DRAFT) {
      throw new BadRequestException('Lines can only be modified on DRAFT goods receipts.');
    }
    const item = await this.itemsRepository.findByReceiptIdAndItemIdWithRefs(goodsReceiptId, itemId);
    if (!item) throw new NotFoundException('Goods receipt item not found.');
    return {
      goodsReceiptId,
      itemId,
      inventoryItemId: item.inventoryItemId,
      tracking: item.inventoryItemTracking,
      poItemId: item.poItemId,
      poOrderedQuantity: item.poOrderedQuantity != null ? Number(item.poOrderedQuantity) : null,
      poReceivedQuantity: item.poReceivedQuantity != null ? Number(item.poReceivedQuantity) : null,
    };
  }

  private async ensureItemBelongsToReceipt(goodsReceiptId: string, itemId: string): Promise<void> {
    const item = await this.itemsRepository.findByReceiptIdAndItemId(goodsReceiptId, itemId);
    if (!item) throw new NotFoundException('Goods receipt item not found.');
  }
}
