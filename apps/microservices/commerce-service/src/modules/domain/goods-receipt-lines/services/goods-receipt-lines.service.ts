import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { goodsReceiptLines, type InventoryTracking, locations } from '@/db/schema';
import { GoodsReceiptLineDto } from '../dto/entity/goods-receipt-line.dto';
import type { AddGoodsReceiptLineDto } from '../dto/request/add-goods-receipt-line.dto';
import type { UpdateGoodsReceiptLineDto } from '../dto/request/update-goods-receipt-line.dto';
import {
  type DistributedReceiptItem,
  GoodsReceiptLinesDomainRepository,
} from '../repositories/goods-receipt-lines.repository';

@Injectable()
export class GoodsReceiptLinesDomainService {
  private readonly logger = new Logger(GoodsReceiptLinesDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    locationName: { column: locations.name, type: 'string' },
    locationPath: { column: locations.pathBreadcrumb, type: 'string' },
  };
  private static readonly FIELD_MAP: FieldMap = {
    ...GoodsReceiptLinesDomainService.SEARCH_FIELD_MAP,
    quantity: { column: goodsReceiptLines.quantity, type: 'number' },
  };

  constructor(private readonly repository: GoodsReceiptLinesDomainRepository) {}

  // Returns one page of a receipt item's lines, narrowed to one of its lots when given
  async findForTable(
    itemId: string,
    state: TableState,
    lotId?: string,
  ): Promise<{ result: GoodsReceiptLineDto[]; count: number }> {
    const orderBy = FilterProcessor.buildOrderBy(state.sort, GoodsReceiptLinesDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable(itemId, {
      where: and(
        FilterProcessor.buildWhere(state.filters, GoodsReceiptLinesDomainService.FIELD_MAP),
        FilterProcessor.buildSearch(state.search, GoodsReceiptLinesDomainService.SEARCH_FIELD_MAP),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [desc(goodsReceiptLines.createdAt)],
      limit,
      offset,
      lotId,
    });
    return { result: result.map(GoodsReceiptLineDto.from), count };
  }

  // Returns one line of a receipt item with its location and lot
  async findById(itemId: string, lineId: string): Promise<GoodsReceiptLineDto> {
    return GoodsReceiptLineDto.from(await this.repository.findOnItemOrThrow(itemId, lineId));
  }

  // Puts part of a draft item's accepted quantity at a location, in one of its lots when it is lot-tracked
  async addLine(
    item: DistributedReceiptItem,
    dto: AddGoodsReceiptLineDto,
    primaryUomQty: number,
  ): Promise<CreateResponseDto<GoodsReceiptLineDto>> {
    const goodsReceiptLotId = dto.goodsReceiptLotId ?? null;
    await this.repository.assertLotFitsItem(item, goodsReceiptLotId);
    this.repository.assertQuantityAllowed(item, dto.quantity);
    await this.repository.assertWithinAcceptedQuantity(item, dto.quantity);
    await this.repository.assertLocationFree(item.id, { goodsReceiptLotId, locationId: dto.locationId });

    const created = await this.repository.create({
      goodsReceiptItemId: item.id,
      siteId: item.siteId,
      goodsReceiptLotId,
      locationId: dto.locationId,
      quantity: dto.quantity,
      primaryUomQty,
    });
    await this.repository.refreshIsBalanced(created.id, item.tracking);

    this.logger.log(`Added line ${created.id} to goods receipt item ${item.id}`);
    return {
      success: true,
      message: 'Line added successfully.',
      data: GoodsReceiptLineDto.from(await this.repository.findOnItemOrThrow(item.id, created.id)),
    };
  }

  // Moves a line of a draft item to another lot or location, or changes its quantity
  async updateLine(
    item: DistributedReceiptItem,
    dto: UpdateGoodsReceiptLineDto,
    primaryUomQty: number | undefined,
  ): Promise<SuccessResponseDto> {
    const line = await this.repository.findOnItemOrThrow(item.id, dto.lineId);
    const goodsReceiptLotId = dto.goodsReceiptLotId === undefined ? line.goodsReceiptLotId : dto.goodsReceiptLotId;
    const locationId = dto.locationId ?? line.locationId;
    const quantity = dto.quantity ?? line.quantity;
    await this.repository.assertLotFitsItem(item, goodsReceiptLotId);
    this.repository.assertQuantityAllowed(item, quantity);
    await this.repository.assertWithinAcceptedQuantity(item, quantity, line.id);
    await this.repository.assertLocationFree(item.id, { goodsReceiptLotId, locationId }, line.id);

    await this.repository.update(line.id, { goodsReceiptLotId, locationId, quantity, primaryUomQty });
    await this.repository.refreshIsBalanced(line.id, item.tracking);

    this.logger.log(`Updated line ${line.id} on goods receipt item ${item.id}`);
    return { success: true, message: 'Line updated successfully.' };
  }

  // Removes a line, with its serials, from a draft receipt item
  async removeLine(item: DistributedReceiptItem, lineId: string): Promise<SuccessResponseDto> {
    const line = await this.repository.findOnItemOrThrow(item.id, lineId);
    await this.repository.delete(line.id);
    this.logger.log(`Removed line ${line.id} from goods receipt item ${item.id}`);
    return { success: true, message: 'Line removed successfully.' };
  }

  // Re-checks whether a line's serials match its quantity after its serials change
  async refreshIsBalanced(lineId: string, tracking: InventoryTracking): Promise<void> {
    await this.repository.refreshIsBalanced(lineId, tracking);
  }
}
