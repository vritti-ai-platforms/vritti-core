import { GoodsReceiptLinesDomainRepository } from '@domain/goods-receipt-lines/repositories/goods-receipt-lines.repository';
import { GoodsReceiptLinesDomainService } from '@domain/goods-receipt-lines/services/goods-receipt-lines.service';
import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type SuccessResponseDto, type TableViewState } from '@vritti/api-sdk/database';
import { and } from '@vritti/api-sdk/drizzle-orm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ValidationException,
} from '@vritti/api-sdk/exceptions';
import { GoodsReceiptStatusValues, goodsReceiptLineItems, InventoryTrackingValues } from '@/db/schema';
import { GoodsReceiptLineItemDto } from '../dto/entity/goods-receipt-line-item.dto';
import { GoodsReceiptLineItemsDomainRepository } from '../repositories/goods-receipt-line-items.repository';

@Injectable()
export class GoodsReceiptLineItemsDomainService {
  private readonly logger = new Logger(GoodsReceiptLineItemsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    serialNumber: { column: goodsReceiptLineItems.serialNumber, type: 'string' },
  };

  constructor(
    private readonly repository: GoodsReceiptLineItemsDomainRepository,
    private readonly linesRepository: GoodsReceiptLinesDomainRepository,
    private readonly linesService: GoodsReceiptLinesDomainService,
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
    const filterWhere = FilterProcessor.buildWhere(state.filters, GoodsReceiptLineItemsDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, GoodsReceiptLineItemsDomainService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const { limit = 20, offset = 0 } = state.pagination;
    const { result, count } = await this.repository.findForTable(lineId, {
      where,
      orderBy: FilterProcessor.buildOrderBy(state.sort, GoodsReceiptLineItemsDomainService.FIELD_MAP),
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
        label: 'Invalid Serial',
        detail: 'Serial number is required.',
        errors: [{ field: 'serialNumber', message: 'Serial number is required.' }],
      });
    }

    const dup = await this.repository.findBySerialOnLine(lineId, trimmed);
    if (dup) {
      throw new ConflictException({
        label: 'Duplicate Serial',
        detail: `Serial "${trimmed}" already added to this line.`,
        errors: [{ field: 'serialNumber', message: 'Serial already on this line.' }],
      });
    }

    // Enforce the user-declared cap on the line. The line's `quantity` field is the expected number
    // of serials at this location; once the count reaches that, the line is balanced and full.
    const currentCount = await this.repository.countByLineId(lineId);
    if (currentCount >= line.quantity) {
      throw new ConflictException({
        label: 'Line Full',
        detail: `This line is full — already has ${line.quantity} serials. Increase the line quantity to add more.`,
        errors: [{ field: 'serialNumber', message: `Line full (${line.quantity} / ${line.quantity}).` }],
      });
    }

    await this.validateSerialForRegister(ctx.inventoryItemId, trimmed);

    // 23505 race fallback handled globally by api-sdk's pg-error filter.
    const entity = await this.repository.create({ goodsReceiptLineId: lineId, serialNumber: trimmed });
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
        label: 'Invalid Serial',
        detail: 'Serial number is required.',
        errors: [{ field: 'serialNumber', message: 'Serial number is required.' }],
      });
    }

    if (trimmed !== existing.serialNumber) {
      const dup = await this.repository.findBySerialOnLine(lineId, trimmed);
      if (dup) {
        throw new ConflictException({
          label: 'Duplicate Serial',
          detail: `Serial "${trimmed}" already added to this line.`,
          errors: [{ field: 'serialNumber', message: 'Serial already on this line.' }],
        });
      }
      await this.validateSerialForRegister(ctx.inventoryItemId, trimmed);
    }

    // 23505 race fallback handled globally by api-sdk's pg-error filter.
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

  // Goods receipt always REGISTERS new serials. Reject collision with existing inventory_item_serials.
  private async validateSerialForRegister(inventoryItemId: string, serialNumber: string): Promise<void> {
    const exists = await this.repository.existsSerialInInventory(inventoryItemId, serialNumber);
    if (exists) {
      throw new ConflictException({
        label: 'Duplicate Serial',
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
