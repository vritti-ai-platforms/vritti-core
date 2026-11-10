import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { goodsReceiptLineItems, type InventoryTracking } from '@/db/schema';
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

  constructor(private readonly repository: GoodsReceiptLineItemsDomainRepository) {}

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

  // Registers a new serial on a line of a serial-tracked item of a draft receipt, up to the line's quantity
  async addLineItem(
    item: SerialReceiptItem,
    line: SerialReceiptLine,
    dto: AddGoodsReceiptLineItemDto,
  ): Promise<CreateResponseDto<GoodsReceiptLineItemDto>> {
    this.repository.assertSerialTracked(item);
    await this.repository.assertLineHasRoom(line);
    await this.repository.assertSerialFree(line, item.inventoryItemId, dto.serialNumber);

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

  // Removes a serial from a line of a draft receipt
  async removeLineItem(line: SerialReceiptLine, lineItemId: string): Promise<SuccessResponseDto> {
    const lineItem = await this.repository.findOnLineOrThrow(line.id, lineItemId);
    await this.repository.delete(lineItem.id);
    this.logger.log(`Removed serial ${lineItem.serialNumber} from goods receipt line ${line.id}`);
    return { success: true, message: `Serial "${lineItem.serialNumber}" removed successfully.` };
  }
}
