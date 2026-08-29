import type {
  AddGoodsReceiptItemFromPurchaseOrderItemDto,
  AddGoodsReceiptItemFromSupplierItemDto,
} from '@commerce/goods-receipts/dto/request/add-goods-receipt-item.dto';
import type { AddGoodsReceiptLineDto } from '@commerce/goods-receipts/dto/request/add-goods-receipt-line.dto';
import type { AddGoodsReceiptLineItemDto } from '@commerce/goods-receipts/dto/request/add-goods-receipt-line-item.dto';
import type { AddGoodsReceiptLotDto } from '@commerce/goods-receipts/dto/request/add-goods-receipt-lot.dto';
import type { CreateGoodsReceiptDto } from '@commerce/goods-receipts/dto/request/create-goods-receipt.dto';
import type { UpdateGoodsReceiptItemDto } from '@commerce/goods-receipts/dto/request/update-goods-receipt-item.dto';
import type { UpdateGoodsReceiptLineDto } from '@commerce/goods-receipts/dto/request/update-goods-receipt-line.dto';
import type { UpdateGoodsReceiptLotDto } from '@commerce/goods-receipts/dto/request/update-goods-receipt-lot.dto';
import type { GoodsReceiptItemQuantsResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-item-quants-response.dto';
import type { GoodsReceiptItemResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-item-response.dto';
import type { GoodsReceiptItemTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-item-table-response.dto';
import type { GoodsReceiptItemsCostResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-items-cost-response.dto';
import type { GoodsReceiptLineItemResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-line-item-response.dto';
import type { GoodsReceiptLineItemTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-line-item-table-response.dto';
import type { GoodsReceiptLineResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-line-response.dto';
import type { GoodsReceiptLineTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-line-table-response.dto';
import type { GoodsReceiptLotResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-lot-response.dto';
import type { GoodsReceiptResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-response.dto';
import type { GoodsReceiptTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-table-response.dto';
import type { GoodsReceiptTreeNodeResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-tree-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SearchState, SuccessResponseDto } from '@vritti/api-sdk/database';
import { majorToMinor } from '@vritti/api-sdk/money';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class GoodsReceiptsGatewayService {
  private readonly logger = new Logger(GoodsReceiptsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Header-level operations

  create(dto: CreateGoodsReceiptDto): Promise<CreateResponseDto<GoodsReceiptResponseDto>> {
    this.logger.log('goodsReceipts.create');
    return this.nats.send('commerce', 'site.goodsReceipts.create', dto);
  }

  async findForTable(userId: string): Promise<GoodsReceiptTableResponseDto> {
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'commerce-site-goods-receipts',
    );
    const { result, count } = await this.nats.send<{ result: GoodsReceiptResponseDto[]; count: number }>(
      'commerce',
      'site.goodsReceipts.table',
      state,
    );
    return { result, count, state, activeViewId };
  }

  findById(id: string): Promise<GoodsReceiptResponseDto> {
    return this.nats.send('commerce', 'site.goodsReceipts.findById', { id });
  }

  // Keyset/cursor Relay connection for the mobile infinite feed. Thin NATS forward; maps first→limit, after→cursor.
  findForFeed(query: { search?: SearchState | null; first?: number; after?: string }): Promise<{
    edges: { cursor: string; node: GoodsReceiptResponseDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log('goodsReceipts.feed');
    return this.nats.send('commerce', 'site.goodsReceipts.feed', {
      search: query.search ?? null,
      limit: query.first ?? 20,
      cursor: query.after,
    });
  }

  findTree(goodsReceiptId: string): Promise<GoodsReceiptTreeNodeResponseDto[]> {
    this.logger.log(`goodsReceipts.tree — receipt: ${goodsReceiptId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.tree', { goodsReceiptId });
  }

  publish(id: string): Promise<GoodsReceiptResponseDto> {
    this.logger.log(`goodsReceipts.publish — id: ${id}`);
    return this.nats.send('commerce', 'site.goodsReceipts.publish', { id });
  }

  linkPurchaseOrder(id: string, purchaseOrderId: string): Promise<SuccessResponseDto> {
    this.logger.log(`goodsReceipts.linkPo — id: ${id}, po: ${purchaseOrderId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.linkPo', { id, purchaseOrderId });
  }

  unlinkPurchaseOrder(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`goodsReceipts.unlinkPo — id: ${id}`);
    return this.nats.send('commerce', 'site.goodsReceipts.unlinkPo', { id });
  }

  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`goodsReceipts.delete — id: ${id}`);
    return this.nats.send('commerce', 'site.goodsReceipts.delete', { id });
  }

  // Items

  findInventoryItemIds(goodsReceiptId: string): Promise<string[]> {
    return this.nats.send('commerce', 'site.goodsReceipts.inventoryItemIds', { goodsReceiptId });
  }

  findItemsCost(goodsReceiptId: string): Promise<GoodsReceiptItemsCostResponseDto> {
    this.logger.log(`goodsReceipts.itemsCost — gr: ${goodsReceiptId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.itemsCost', { goodsReceiptId });
  }

  findItemQuants(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItemQuantsResponseDto> {
    this.logger.log(`goodsReceipts.itemQuants — gr: ${goodsReceiptId}, item: ${itemId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.itemQuants', { goodsReceiptId, itemId });
  }

  async findItemsTable(goodsReceiptId: string, userId: string): Promise<GoodsReceiptItemTableResponseDto> {
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `goods-receipt-${goodsReceiptId}-items`,
    );
    const { result, count } = await this.nats.send<{ result: GoodsReceiptItemResponseDto[]; count: number }>(
      'commerce',
      'site.goodsReceipts.itemsTable',
      { goodsReceiptId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  findItemById(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItemResponseDto> {
    return this.nats.send('commerce', 'site.goodsReceipts.itemById', { goodsReceiptId, itemId });
  }

  addItemFromSupplierItem(
    goodsReceiptId: string,
    dto: AddGoodsReceiptItemFromSupplierItemDto,
  ): Promise<CreateResponseDto<GoodsReceiptItemResponseDto>> {
    const { unitPrice, ...rest } = dto;
    const unitPriceMinor = unitPrice ? majorToMinor(unitPrice.value, unitPrice.currency).toString() : undefined;
    return this.nats.send('commerce', 'site.goodsReceipts.addItemFromSupplierItem', {
      goodsReceiptId,
      ...rest,
      unitPrice: unitPriceMinor,
      currencyCode: unitPrice?.currency,
    });
  }

  addItemFromPurchaseOrderItem(
    goodsReceiptId: string,
    dto: AddGoodsReceiptItemFromPurchaseOrderItemDto,
  ): Promise<CreateResponseDto<GoodsReceiptItemResponseDto>> {
    const { unitPrice, ...rest } = dto;
    const unitPriceMinor = unitPrice ? majorToMinor(unitPrice.value, unitPrice.currency).toString() : undefined;
    return this.nats.send('commerce', 'site.goodsReceipts.addItemFromPurchaseOrderItem', {
      goodsReceiptId,
      ...rest,
      unitPrice: unitPriceMinor,
      currencyCode: unitPrice?.currency,
    });
  }

  updateItem(goodsReceiptId: string, itemId: string, dto: UpdateGoodsReceiptItemDto): Promise<SuccessResponseDto> {
    const { unitPrice, ...rest } = dto;
    const unitPriceMinor = unitPrice ? majorToMinor(unitPrice.value, unitPrice.currency).toString() : undefined;
    return this.nats.send('commerce', 'site.goodsReceipts.updateItem', {
      goodsReceiptId,
      itemId,
      ...rest,
      unitPrice: unitPriceMinor,
      currencyCode: unitPrice?.currency,
    });
  }

  removeItem(goodsReceiptId: string, itemId: string): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'site.goodsReceipts.removeItem', { goodsReceiptId, itemId });
  }

  // Lots (item-scoped)

  findLots(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptLotResponseDto[]> {
    return this.nats.send('commerce', 'site.goodsReceipts.lots', { goodsReceiptId, itemId });
  }

  addLot(
    goodsReceiptId: string,
    itemId: string,
    dto: AddGoodsReceiptLotDto,
  ): Promise<CreateResponseDto<GoodsReceiptLotResponseDto>> {
    const { mrp, ...rest } = dto;
    return this.nats.send('commerce', 'site.goodsReceipts.addLot', {
      goodsReceiptId,
      itemId,
      ...rest,
      mrp: mrp ? majorToMinor(mrp.value, mrp.currency).toString() : (mrp as null | undefined),
    });
  }

  updateLot(
    goodsReceiptId: string,
    itemId: string,
    lotId: string,
    dto: UpdateGoodsReceiptLotDto,
  ): Promise<GoodsReceiptLotResponseDto> {
    const { mrp, ...rest } = dto;
    return this.nats.send('commerce', 'site.goodsReceipts.updateLot', {
      goodsReceiptId,
      itemId,
      lotId,
      ...rest,
      mrp: mrp ? majorToMinor(mrp.value, mrp.currency).toString() : (mrp as null | undefined),
    });
  }

  removeLot(goodsReceiptId: string, itemId: string, lotId: string): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'site.goodsReceipts.removeLot', { goodsReceiptId, itemId, lotId });
  }

  // Lines (item-scoped)

  async findLinesTable(
    goodsReceiptId: string,
    itemId: string,
    userId: string,
  ): Promise<GoodsReceiptLineTableResponseDto> {
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `goods-receipt-${goodsReceiptId}-item-${itemId}-lines`,
    );
    const { result, count } = await this.nats.send<{ result: GoodsReceiptLineResponseDto[]; count: number }>(
      'commerce',
      'site.goodsReceipts.linesTable',
      { goodsReceiptId, itemId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  async findLinesByLotTable(
    goodsReceiptId: string,
    itemId: string,
    lotId: string,
    userId: string,
  ): Promise<GoodsReceiptLineTableResponseDto> {
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `goods-receipt-${goodsReceiptId}-item-${itemId}-lot-${lotId}-lines`,
    );
    const { result, count } = await this.nats.send<{ result: GoodsReceiptLineResponseDto[]; count: number }>(
      'commerce',
      'site.goodsReceipts.linesByLotTable',
      { goodsReceiptId, itemId, lotId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  findLineById(goodsReceiptId: string, itemId: string, lineId: string): Promise<GoodsReceiptLineResponseDto> {
    return this.nats.send('commerce', 'site.goodsReceipts.lineById', { goodsReceiptId, itemId, lineId });
  }

  addLine(
    goodsReceiptId: string,
    itemId: string,
    dto: AddGoodsReceiptLineDto,
  ): Promise<CreateResponseDto<GoodsReceiptLineResponseDto>> {
    return this.nats.send('commerce', 'site.goodsReceipts.addLine', { goodsReceiptId, itemId, ...dto });
  }

  updateLine(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    dto: UpdateGoodsReceiptLineDto,
  ): Promise<GoodsReceiptLineResponseDto> {
    return this.nats.send('commerce', 'site.goodsReceipts.updateLine', { goodsReceiptId, itemId, lineId, ...dto });
  }

  removeLine(goodsReceiptId: string, itemId: string, lineId: string): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'site.goodsReceipts.removeLine', { goodsReceiptId, itemId, lineId });
  }

  // Line items (serials, line-scoped)

  async findLineItemsTable(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    userId: string,
  ): Promise<GoodsReceiptLineItemTableResponseDto> {
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `goods-receipt-${goodsReceiptId}-line-${lineId}-items`,
    );
    const { result, count } = await this.nats.send<{ result: GoodsReceiptLineItemResponseDto[]; count: number }>(
      'commerce',
      'site.goodsReceipts.lineItemsTable',
      { goodsReceiptId, itemId, lineId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  addLineItem(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    dto: AddGoodsReceiptLineItemDto,
  ): Promise<GoodsReceiptLineItemResponseDto> {
    return this.nats.send('commerce', 'site.goodsReceipts.addLineItem', { goodsReceiptId, itemId, lineId, ...dto });
  }

  removeLineItem(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    subItemId: string,
  ): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'site.goodsReceipts.removeLineItem', {
      goodsReceiptId,
      itemId,
      lineId,
      subItemId,
    });
  }
}
