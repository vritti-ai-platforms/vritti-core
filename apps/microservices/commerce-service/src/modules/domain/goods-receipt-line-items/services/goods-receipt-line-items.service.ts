import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import {
  type GoodsReceiptLineItem,
  goodsReceiptLineItems,
  type InventoryTracking,
  InventoryTrackingValues,
} from '@/db/schema';
import { GoodsReceiptLineItemDto } from '../dto/entity/goods-receipt-line-item.dto';
import type { AddGoodsReceiptLineItemDto } from '../dto/request/add-goods-receipt-line-item.dto';
import { GoodsReceiptLineItemsDomainRepository } from '../repositories/goods-receipt-line-items.repository';

export interface SerialReceiptItem {
  siteId: string;
  inventoryItemId: string;
  tracking: InventoryTracking;
}

export interface SerialReceiptLine {
  id: string;
  quantity: number;
}

@Injectable()
export class GoodsReceiptLineItemsDomainService {
  private readonly logger = new Logger(GoodsReceiptLineItemsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    serialNumber: { column: goodsReceiptLineItems.serialNumber, type: 'string' },
  };
  private static readonly SERIAL_TRACKINGS: InventoryTracking[] = [
    InventoryTrackingValues.SERIAL,
    InventoryTrackingValues.LOT_SERIAL,
  ];

  constructor(private readonly repository: GoodsReceiptLineItemsDomainRepository) {}

  // Registers a new serial on a line of a serial-tracked item of a draft receipt, up to the line's quantity
  async addLineItem(
    item: SerialReceiptItem,
    line: SerialReceiptLine,
    dto: AddGoodsReceiptLineItemDto,
  ): Promise<CreateResponseDto<GoodsReceiptLineItemDto>> {
    this.assertSerialTracked(item);
    await this.assertLineHasRoom(line);
    await this.assertSerialFree(line, item.inventoryItemId, dto.serialNumber);

    const created = await this.repository.create({
      goodsReceiptLineId: line.id,
      siteId: item.siteId,
      serialNumber: dto.serialNumber,
    });

    this.logger.log(`Added serial ${dto.serialNumber} to goods receipt line ${line.id}`);
    return {
      success: true,
      message: `Serial "${dto.serialNumber}" added successfully.`,
      data: GoodsReceiptLineItemDto.from(created),
    };
  }

  // Returns one page of the serials registered on a line
  async findForTable(lineId: string, state: TableState): Promise<{ result: GoodsReceiptLineItemDto[]; count: number }> {
    const fieldMap = GoodsReceiptLineItemsDomainService.FIELD_MAP;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, fieldMap);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable(lineId, {
      where: and(
        FilterProcessor.buildWhere(state.filters, fieldMap),
        FilterProcessor.buildSearch(state.search, fieldMap),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [asc(goodsReceiptLineItems.createdAt)],
      limit,
      offset,
    });
    return { result: result.map(GoodsReceiptLineItemDto.from), count };
  }

  // Returns the serials registered on a line, oldest first, for landing them in stock
  findSerialsOfLine(lineId: string): Promise<GoodsReceiptLineItem[]> {
    return this.repository.findByLineId(lineId);
  }

  // Removes a serial from a line of a draft receipt
  async removeLineItem(line: SerialReceiptLine, lineItemId: string): Promise<SuccessResponseDto> {
    const lineItem = await this.findOnLineOrThrow(line.id, lineItemId);
    await this.repository.delete(lineItem.id);
    this.logger.log(`Removed serial ${lineItem.serialNumber} from goods receipt line ${line.id}`);
    return { success: true, message: `Serial "${lineItem.serialNumber}" removed successfully.` };
  }

  // Loads a serial of the given line, throwing when it is not on it
  private async findOnLineOrThrow(lineId: string, lineItemId: string): Promise<GoodsReceiptLineItem> {
    const lineItem = await this.repository.findOnLine(lineId, lineItemId);
    if (!lineItem) throw new NotFoundException('Serial not found on this line.');
    return lineItem;
  }

  // Rejects serials on an item that is not tracked by serial
  private assertSerialTracked(item: { tracking: InventoryTracking }): void {
    if (GoodsReceiptLineItemsDomainService.SERIAL_TRACKINGS.includes(item.tracking)) return;
    throw new BadRequestException({
      label: 'Serials Not Tracked',
      detail: `This item is tracked by ${item.tracking.toLowerCase()}, so it has no serials.`,
    });
  }

  // Rejects a serial beyond the line's quantity
  private async assertLineHasRoom(line: SerialReceiptLine): Promise<void> {
    const serialCount = await this.repository.countOnLine(line.id);
    if (serialCount < line.quantity) return;
    throw new ConflictException({
      label: 'Line Full',
      detail: `This line already has its ${line.quantity} serials. Increase the line quantity to add more.`,
      errors: [{ field: 'serialNumber', message: 'Line is full' }],
    });
  }

  // Rejects a serial already on the line or already registered in inventory — a receipt only registers new serials
  private async assertSerialFree(
    line: SerialReceiptLine,
    inventoryItemId: string,
    serialNumber: string,
  ): Promise<void> {
    const { isOnLine, isInInventory } = await this.repository.findSerialConflict(
      line.id,
      inventoryItemId,
      serialNumber,
    );
    if (isOnLine) {
      throw new ConflictException({
        label: 'Duplicate Serial',
        detail: `Serial "${serialNumber}" is already on this line.`,
        errors: [{ field: 'serialNumber', message: 'Already on this line' }],
      });
    }
    if (!isInInventory) return;
    throw new ConflictException({
      label: 'Duplicate Serial',
      detail: `Serial "${serialNumber}" already exists in inventory.`,
      errors: [{ field: 'serialNumber', message: 'Already in inventory' }],
    });
  }
}
