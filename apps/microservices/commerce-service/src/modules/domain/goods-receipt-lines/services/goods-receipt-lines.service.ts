import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import Decimal from '@vritti/api-sdk/decimal';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException, ValidationException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { goodsReceiptLines, type InventoryTracking, InventoryTrackingValues, locations } from '@/db/schema';
import { GoodsReceiptLineDto } from '../dto/entity/goods-receipt-line.dto';
import type { AddGoodsReceiptLineDto } from '../dto/request/add-goods-receipt-line.dto';
import type { UpdateGoodsReceiptLineDto } from '../dto/request/update-goods-receipt-line.dto';
import {
  type GoodsReceiptLineRow,
  GoodsReceiptLinesDomainRepository,
} from '../repositories/goods-receipt-lines.repository';

export interface DistributedReceiptItem {
  id: string;
  siteId: string;
  tracking: InventoryTracking;
  receivedQty: number;
  rejectedQuantity: number;
}

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
  private static readonly LOT_TRACKINGS: InventoryTracking[] = [
    InventoryTrackingValues.LOT,
    InventoryTrackingValues.LOT_SERIAL,
  ];
  private static readonly SERIAL_TRACKINGS: InventoryTracking[] = [
    InventoryTrackingValues.SERIAL,
    InventoryTrackingValues.LOT_SERIAL,
  ];

  constructor(private readonly repository: GoodsReceiptLinesDomainRepository) {}

  // Puts part of a draft item's accepted quantity at a location, in one of its lots when it is lot-tracked
  async addLine(
    item: DistributedReceiptItem,
    dto: AddGoodsReceiptLineDto,
    primaryUomQty: number,
  ): Promise<CreateResponseDto<GoodsReceiptLineDto>> {
    const goodsReceiptLotId = dto.goodsReceiptLotId ?? null;
    await this.assertLotFitsItem(item, goodsReceiptLotId);
    this.assertQuantityAllowed(item, dto.quantity);
    await this.assertWithinAcceptedQuantity(item, dto.quantity);
    await this.assertLocationFree(item.id, { goodsReceiptLotId, locationId: dto.locationId });

    const created = await this.repository.create({
      goodsReceiptItemId: item.id,
      siteId: item.siteId,
      goodsReceiptLotId,
      locationId: dto.locationId,
      quantity: dto.quantity,
      primaryUomQty,
    });
    await this.refreshIsBalanced(created.id, item.tracking);

    this.logger.log(`Added line ${created.id} to goods receipt item ${item.id}`);
    return {
      success: true,
      message: 'Line added successfully.',
      data: GoodsReceiptLineDto.from(await this.findOnItemOrThrow(item.id, created.id)),
    };
  }

  // Moves a line of a draft item to another lot or location, or changes its quantity
  async updateLine(
    item: DistributedReceiptItem,
    dto: UpdateGoodsReceiptLineDto,
    primaryUomQty: number | undefined,
  ): Promise<SuccessResponseDto> {
    const line = await this.findOnItemOrThrow(item.id, dto.lineId);
    const goodsReceiptLotId = dto.goodsReceiptLotId === undefined ? line.goodsReceiptLotId : dto.goodsReceiptLotId;
    const locationId = dto.locationId ?? line.locationId;
    const quantity = dto.quantity ?? line.quantity;
    await this.assertLotFitsItem(item, goodsReceiptLotId);
    this.assertQuantityAllowed(item, quantity);
    await this.assertWithinAcceptedQuantity(item, quantity, line.id);
    await this.assertLocationFree(item.id, { goodsReceiptLotId, locationId }, line.id);

    await this.repository.update(line.id, { goodsReceiptLotId, locationId, quantity, primaryUomQty });
    await this.refreshIsBalanced(line.id, item.tracking);

    this.logger.log(`Updated line ${line.id} on goods receipt item ${item.id}`);
    return { success: true, message: 'Line updated successfully.' };
  }

  // Marks a line balanced: always when it carries no serials, otherwise once its serial count matches its quantity
  async refreshIsBalanced(lineId: string, tracking: InventoryTracking): Promise<void> {
    if (GoodsReceiptLinesDomainService.SERIAL_TRACKINGS.includes(tracking)) {
      await this.repository.updateIsBalancedFromSerialCount(lineId);
      return;
    }
    await this.repository.update(lineId, { isBalanced: true });
  }

  // Records the quant a line landed in, in the caller's transaction
  async linkQuant(lineId: string, quantId: string): Promise<void> {
    await this.repository.update(lineId, { resolvedQuantId: quantId });
  }

  // Returns one line of a receipt item with its location and lot
  async findById(itemId: string, lineId: string): Promise<GoodsReceiptLineDto> {
    return GoodsReceiptLineDto.from(await this.findOnItemOrThrow(itemId, lineId));
  }

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

  // Loads a line of the given receipt item, throwing when it is not on it
  async findOnItemOrThrow(itemId: string, lineId: string): Promise<GoodsReceiptLineRow> {
    const line = await this.repository.findOnItem(itemId, lineId);
    if (!line) throw new NotFoundException('Goods receipt line not found.');
    return line;
  }

  // Returns every line of a receipt item with its location and lot, for landing them in stock
  findLinesOfItem(itemId: string): Promise<GoodsReceiptLineRow[]> {
    return this.repository.findByItemId(itemId);
  }

  // Removes a line, with its serials, from a draft receipt item
  async removeLine(item: DistributedReceiptItem, lineId: string): Promise<SuccessResponseDto> {
    const line = await this.findOnItemOrThrow(item.id, lineId);
    await this.repository.delete(line.id);
    this.logger.log(`Removed line ${line.id} from goods receipt item ${item.id}`);
    return { success: true, message: 'Line removed successfully.' };
  }

  // Rejects a lot that does not suit the item: lot-tracked items need one of their own lots, the others take none
  private async assertLotFitsItem(item: DistributedReceiptItem, goodsReceiptLotId: string | null): Promise<void> {
    const isLotTracked = GoodsReceiptLinesDomainService.LOT_TRACKINGS.includes(item.tracking);
    if (!isLotTracked) {
      this.assertNoLot(item, goodsReceiptLotId);
      return;
    }
    if (goodsReceiptLotId === null) {
      throw new ValidationException({
        label: 'Lot Required',
        detail: 'This item is tracked by lot; pick the lot the line holds.',
        errors: [{ field: 'goodsReceiptLotId', message: 'Lot is required' }],
      });
    }
    const isOwnLot = await this.repository.isLotOfItem(goodsReceiptLotId, item.id);
    if (isOwnLot) return;
    throw new ValidationException({
      label: 'Unknown Lot',
      detail: "The lot is not one of this item's lots on the goods receipt.",
      errors: [{ field: 'goodsReceiptLotId', message: 'Not a lot of this item' }],
    });
  }

  // Rejects a lot on a line of an item that is not tracked by lot
  private assertNoLot(item: DistributedReceiptItem, goodsReceiptLotId: string | null): void {
    if (goodsReceiptLotId === null) return;
    throw new ValidationException({
      label: 'Lot Not Tracked',
      detail: `This item is tracked by ${item.tracking.toLowerCase()}, so its lines take no lot.`,
      errors: [{ field: 'goodsReceiptLotId', message: 'Not tracked by lot' }],
    });
  }

  // Rejects a zero-quantity line unless its serials are still to be scanned
  private assertQuantityAllowed(item: DistributedReceiptItem, quantity: number): void {
    if (quantity > 0) return;
    if (GoodsReceiptLinesDomainService.SERIAL_TRACKINGS.includes(item.tracking)) return;
    throw new ValidationException({
      label: 'Quantity Required',
      detail: 'Enter how much of the item this line holds.',
      errors: [{ field: 'quantity', message: 'Must be more than 0' }],
    });
  }

  // Rejects lines that would hold more than the item's accepted (received less rejected) quantity
  private async assertWithinAcceptedQuantity(
    item: DistributedReceiptItem,
    quantity: number,
    excludeLineId?: string,
  ): Promise<void> {
    const distributed = await this.repository.sumQuantityOfItem(item.id, excludeLineId);
    const accepted = new Decimal(item.receivedQty).minus(item.rejectedQuantity);
    const remaining = accepted.minus(distributed);
    if (remaining.gte(quantity)) return;
    throw new ValidationException({
      label: 'Exceeds Accepted Quantity',
      detail: `Only ${remaining.toString()} of the ${accepted.toString()} accepted is not on a line yet.`,
      errors: [{ field: 'quantity', message: `At most ${remaining.toString()}` }],
    });
  }

  // Rejects a second line for the same item, lot and location
  private async assertLocationFree(
    itemId: string,
    line: { goodsReceiptLotId: string | null; locationId: string },
    excludeLineId?: string,
  ): Promise<void> {
    const isTaken = await this.repository.isLocationTaken(itemId, line, excludeLineId);
    if (!isTaken) return;
    throw new ConflictException({
      label: 'Duplicate Line',
      detail: 'A line for this location already exists on this item. Edit that line instead.',
      errors: [{ field: 'locationId', message: 'Already has a line' }],
    });
  }
}
