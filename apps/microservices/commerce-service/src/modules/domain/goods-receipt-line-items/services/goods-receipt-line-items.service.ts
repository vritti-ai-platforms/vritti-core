import { GoodsReceiptLinesRepository } from '@domain/goods-receipt-lines/repositories/goods-receipt-lines.repository';
import { GoodsReceiptLinesService } from '@domain/goods-receipt-lines/services/goods-receipt-lines.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  FilterProcessor,
  type SuccessResponseDto,
  type TableViewState,
  ValidationException,
} from '@vritti/api-sdk';
import { and, eq } from '@vritti/api-sdk/drizzle-orm';
import {
  GoodsReceiptStatusValues,
  inventoryItemQuantItems,
  InventoryTrackingValues,
  goodsReceiptLineItems,
} from '@/db/schema';
import { GoodsReceiptLineItemDto } from '../dto/entity/goods-receipt-line-item.dto';
import { GoodsReceiptLineItemsRepository } from '../repositories/goods-receipt-line-items.repository';

@Injectable()
export class GoodsReceiptLineItemsService {
  private readonly logger = new Logger(GoodsReceiptLineItemsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    serialNumber: { column: goodsReceiptLineItems.serialNumber, type: 'string' },
  };

  constructor(
    private readonly repository: GoodsReceiptLineItemsRepository,
    private readonly linesRepository: GoodsReceiptLinesRepository,
    private readonly linesService: GoodsReceiptLinesService,
  ) {}

  async listByLine(goodsReceiptId: string, itemId: string, lineId: string): Promise<GoodsReceiptLineItemDto[]> {
    await this.ensureLineBelongsToItem(goodsReceiptId, itemId, lineId);
    const rows = await this.repository.findByLineId(lineId);
    return rows.map(GoodsReceiptLineItemDto.from);
  }

  async findForTable(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    state: TableViewState,
  ): Promise<{ result: GoodsReceiptLineItemDto[]; count: number }> {
    await this.ensureLineBelongsToItem(goodsReceiptId, itemId, lineId);
    const filterWhere = FilterProcessor.buildWhere(state.filters, GoodsReceiptLineItemsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, GoodsReceiptLineItemsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const { limit = 20, offset = 0 } = state.pagination;
    const { result, count } = await this.repository.findForTable(lineId, {
      where,
      orderBy: FilterProcessor.buildOrderBy(state.sort, GoodsReceiptLineItemsService.FIELD_MAP),
      limit,
      offset,
    });
    return { result: result.map(GoodsReceiptLineItemDto.from), count };
  }

  async addLineItem(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    data: { serialNumber: string },
  ): Promise<GoodsReceiptLineItemDto> {
    const ctx = await this.linesService.getItemContext(goodsReceiptId, itemId);
    if (ctx.tracking !== InventoryTrackingValues.SERIAL && ctx.tracking !== InventoryTrackingValues.LOT_SERIAL) {
      throw new BadRequestException('Line items are only allowed on serial-tracked items.');
    }

    const line = await this.linesRepository.findById(lineId);
    if (!line || line.goodsReceiptItemId !== itemId) {
      throw new NotFoundException('Goods receipt line not found.');
    }

    const trimmed = data.serialNumber?.trim();
    if (!trimmed) {
      throw new ValidationException({
        detail: 'Serial number is required.',
        errors: [{ field: 'serialNumber', message: 'Serial number is required.' }],
      });
    }

    // Already on this line?
    const dup = await this.repository.findBySerialOnLine(lineId, trimmed);
    if (dup) {
      throw new ValidationException({
        detail: `Serial "${trimmed}" already added to this line.`,
        errors: [{ field: 'serialNumber', message: 'Serial already on this line.' }],
      });
    }

    await this.validateSerialForRegister(ctx.inventoryItemId, trimmed);

    // PO cap check: each new serial bumps the line quantity which contributes to the item total
    await this.linesService.validatePoCap(ctx, 1, lineId);

    const entity = await this.repository.create({
      goodsReceiptLineId: lineId,
      serialNumber: trimmed,
    });
    await this.linesRepository.refreshIsBalanced(lineId, ctx.tracking);

    this.logger.log(`Added line item ${entity.id} (serial=${trimmed}) to line ${lineId}`);
    return GoodsReceiptLineItemDto.from(entity);
  }

  async updateLineItem(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    subItemId: string,
    data: { serialNumber: string },
  ): Promise<GoodsReceiptLineItemDto> {
    const ctx = await this.linesService.getItemContext(goodsReceiptId, itemId);
    if (ctx.tracking !== InventoryTrackingValues.SERIAL && ctx.tracking !== InventoryTrackingValues.LOT_SERIAL) {
      throw new BadRequestException('Line items are only allowed on serial-tracked items.');
    }

    const line = await this.linesRepository.findById(lineId);
    if (!line || line.goodsReceiptItemId !== itemId) {
      throw new NotFoundException('Goods receipt line not found.');
    }

    const existing = await this.repository.findById(subItemId);
    if (!existing || existing.goodsReceiptLineId !== lineId) {
      throw new NotFoundException('Goods receipt line item not found.');
    }

    const trimmed = data.serialNumber?.trim();
    if (!trimmed) {
      throw new ValidationException({
        detail: 'Serial number is required.',
        errors: [{ field: 'serialNumber', message: 'Serial number is required.' }],
      });
    }

    if (trimmed !== existing.serialNumber) {
      const dup = await this.repository.findBySerialOnLine(lineId, trimmed);
      if (dup) {
        throw new ValidationException({
          detail: `Serial "${trimmed}" already added to this line.`,
          errors: [{ field: 'serialNumber', message: 'Serial already on this line.' }],
        });
      }
      await this.validateSerialForRegister(ctx.inventoryItemId, trimmed);
    }

    const updated = await this.repository.update(subItemId, { serialNumber: trimmed });
    await this.linesRepository.refreshIsBalanced(lineId, ctx.tracking);
    return GoodsReceiptLineItemDto.from(updated);
  }

  async removeLineItem(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    subItemId: string,
  ): Promise<SuccessResponseDto> {
    const ctx = await this.linesService.getItemContext(goodsReceiptId, itemId);
    const line = await this.linesRepository.findById(lineId);
    if (!line || line.goodsReceiptItemId !== itemId) {
      throw new NotFoundException('Goods receipt line not found.');
    }
    const existing = await this.repository.findById(subItemId);
    if (!existing || existing.goodsReceiptLineId !== lineId) {
      throw new NotFoundException('Goods receipt line item not found.');
    }

    await this.repository.delete(subItemId);
    await this.linesRepository.refreshIsBalanced(lineId, ctx.tracking);
    return { success: true, message: `Serial "${existing.serialNumber}" removed successfully.` };
  }

  // Goods receipt always REGISTERS new serials. Reject collision with existing inventory_item_quant_items
  // for this inventory item.
  private async validateSerialForRegister(inventoryItemId: string, serialNumber: string): Promise<void> {
    const rows = await this.repository['db']
      .select({ id: inventoryItemQuantItems.id })
      .from(inventoryItemQuantItems)
      .where(
        and(
          eq(inventoryItemQuantItems.inventoryItemId, inventoryItemId),
          eq(inventoryItemQuantItems.serialNumber, serialNumber),
        ),
      )
      .limit(1);
    if (rows.length > 0) {
      throw new ValidationException({
        detail: `Serial "${serialNumber}" already exists in inventory.`,
        errors: [{ field: 'serialNumber', message: 'Serial already exists in inventory.' }],
      });
    }
  }

  private async ensureLineBelongsToItem(goodsReceiptId: string, itemId: string, lineId: string): Promise<void> {
    void goodsReceiptId;
    const line = await this.linesRepository.findById(lineId);
    if (!line || line.goodsReceiptItemId !== itemId) {
      throw new NotFoundException('Goods receipt line not found.');
    }
  }
}

void GoodsReceiptStatusValues;
