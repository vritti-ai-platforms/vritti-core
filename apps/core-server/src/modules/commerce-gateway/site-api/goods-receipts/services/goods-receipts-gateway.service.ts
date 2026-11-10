import type { AddGoodsReceiptLineDto } from '@commerce/goods-receipts/dto/request/add-goods-receipt-line.dto';
import type { AddGoodsReceiptLineItemDto } from '@commerce/goods-receipts/dto/request/add-goods-receipt-line-item.dto';
import type { AddGoodsReceiptLotDto } from '@commerce/goods-receipts/dto/request/add-goods-receipt-lot.dto';
import type { AddGoodsReceiptPurchaseOrderDto } from '@commerce/goods-receipts/dto/request/add-goods-receipt-purchase-order.dto';
import type { CreateGoodsReceiptFromDeliveryDto } from '@commerce/goods-receipts/dto/request/create-goods-receipt-from-delivery.dto';
import type { CreateGoodsReceiptFromPurchaseOrdersDto } from '@commerce/goods-receipts/dto/request/create-goods-receipt-from-purchase-orders.dto';
import type { UpdateGoodsReceiptDto } from '@commerce/goods-receipts/dto/request/update-goods-receipt.dto';
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
import { type SearchState } from '@vritti/api-sdk/conditions';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

export interface GoodsReceiptFeedQuery {
  search?: SearchState | null;
  first?: number;
  after?: string;
}

export interface GoodsReceiptFeedResponse {
  edges: { cursor: string; node: GoodsReceiptResponseDto }[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

@Injectable()
export class GoodsReceiptsGatewayService {
  private readonly logger = new Logger(GoodsReceiptsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
  ) {}

  // Creates a draft goods receipt of an announced inbound delivery, pre-filled with its open lines
  createFromDelivery(dto: CreateGoodsReceiptFromDeliveryDto): Promise<CreateResponseDto<GoodsReceiptResponseDto>> {
    this.logger.log(`site.goodsReceipts.createFromDelivery — inboundDeliveryId: ${dto.inboundDeliveryId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.createFromDelivery', dto);
  }

  // Creates an arrived inbound delivery of a supplier's purchase orders and a draft goods receipt of it
  createFromPurchaseOrders(
    dto: CreateGoodsReceiptFromPurchaseOrdersDto,
  ): Promise<CreateResponseDto<GoodsReceiptResponseDto>> {
    this.logger.log(
      `site.goodsReceipts.createFromPurchaseOrders — supplierId: ${dto.supplierId}, purchaseOrders: ${dto.purchaseOrderIds.length}`,
    );
    return this.nats.send('commerce', 'site.goodsReceipts.createFromPurchaseOrders', dto);
  }

  // Adds the open lines of another purchase order of the supplier to a draft goods receipt and its inbound delivery
  addPurchaseOrder(goodsReceiptId: string, dto: AddGoodsReceiptPurchaseOrderDto): Promise<SuccessResponseDto> {
    this.logger.log(
      `site.goodsReceipts.addPurchaseOrder — goodsReceiptId: ${goodsReceiptId}, purchaseOrderId: ${dto.purchaseOrderId}`,
    );
    return this.nats.send('commerce', 'site.goodsReceipts.addPurchaseOrder', { goodsReceiptId, ...dto });
  }

  // Returns the site's goods receipts for the data table with server-stored state
  async findForTable(userId: string): Promise<GoodsReceiptTableResponseDto> {
    this.logger.log('site.goodsReceipts.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-site-goods-receipts');
    const { result, count } = await this.nats.send<{ result: GoodsReceiptResponseDto[]; count: number }>(
      'commerce',
      'site.goodsReceipts.table',
      state,
    );
    return { result, count, state, activeViewId };
  }

  // Returns one goods receipt
  findById(id: string): Promise<GoodsReceiptResponseDto> {
    this.logger.log(`site.goodsReceipts.findById — id: ${id}`);
    return this.nats.send('commerce', 'site.goodsReceipts.findById', { id });
  }

  // Returns a keyset page of the site's goods receipts for the mobile feed, mapping first → limit and after → cursor
  findForFeed(query: GoodsReceiptFeedQuery): Promise<GoodsReceiptFeedResponse> {
    this.logger.log('site.goodsReceipts.feed');
    return this.nats.send('commerce', 'site.goodsReceipts.feed', {
      search: query.search ?? null,
      limit: query.first ?? 20,
      cursor: query.after,
    });
  }

  // Changes a draft goods receipt's notes and the supplier's delivery note on the inbound delivery it created
  update(id: string, dto: UpdateGoodsReceiptDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.update — id: ${id}`);
    return this.nats.send('commerce', 'site.goodsReceipts.update', { id, ...dto });
  }

  // Returns a goods receipt's items with their lots and lines as a tree
  findTree(goodsReceiptId: string): Promise<GoodsReceiptTreeNodeResponseDto[]> {
    this.logger.log(`site.goodsReceipts.tree — goodsReceiptId: ${goodsReceiptId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.tree', { goodsReceiptId });
  }

  // Publishes a goods receipt, landing its stock at the site
  publish(id: string): Promise<GoodsReceiptResponseDto> {
    this.logger.log(`site.goodsReceipts.publish — id: ${id}`);
    return this.nats.send('commerce', 'site.goodsReceipts.publish', { id });
  }

  // Deletes a draft goods receipt
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.delete — id: ${id}`);
    return this.nats.send('commerce', 'site.goodsReceipts.delete', { id });
  }

  // Returns the inventory items counted on a goods receipt
  findInventoryItemIds(goodsReceiptId: string): Promise<string[]> {
    this.logger.log(`site.goodsReceipts.inventoryItemIds — goodsReceiptId: ${goodsReceiptId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.inventoryItemIds', { goodsReceiptId });
  }

  // Returns the provisional cost of a goods receipt's items
  findItemsCost(goodsReceiptId: string): Promise<GoodsReceiptItemsCostResponseDto> {
    this.logger.log(`site.goodsReceipts.itemsCost — goodsReceiptId: ${goodsReceiptId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.itemsCost', { goodsReceiptId });
  }

  // Returns the quants a published goods receipt item landed in
  findItemQuants(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItemQuantsResponseDto> {
    this.logger.log(`site.goodsReceipts.itemQuants — goodsReceiptId: ${goodsReceiptId}, itemId: ${itemId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.itemQuants', { goodsReceiptId, itemId });
  }

  // Returns a goods receipt's items for the data table with server-stored state
  async findItemsTable(goodsReceiptId: string, userId: string): Promise<GoodsReceiptItemTableResponseDto> {
    this.logger.log(`site.goodsReceipts.itemsTable — goodsReceiptId: ${goodsReceiptId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
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

  // Returns one item of a goods receipt
  findItemById(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItemResponseDto> {
    this.logger.log(`site.goodsReceipts.itemById — itemId: ${itemId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.itemById', { goodsReceiptId, itemId });
  }

  // Changes the received or rejected quantity of a goods receipt item
  updateItem(goodsReceiptId: string, itemId: string, dto: UpdateGoodsReceiptItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.updateItem — itemId: ${itemId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.updateItem', { goodsReceiptId, itemId, ...dto });
  }

  // Removes an item from a goods receipt
  removeItem(goodsReceiptId: string, itemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.removeItem — itemId: ${itemId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.removeItem', { goodsReceiptId, itemId });
  }

  // Returns the lots of a goods receipt item
  findLots(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptLotResponseDto[]> {
    this.logger.log(`site.goodsReceipts.lots — itemId: ${itemId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.lots', { goodsReceiptId, itemId });
  }

  // Adds a lot to a goods receipt item
  addLot(
    goodsReceiptId: string,
    itemId: string,
    dto: AddGoodsReceiptLotDto,
  ): Promise<CreateResponseDto<GoodsReceiptLotResponseDto>> {
    this.logger.log(`site.goodsReceipts.addLot — itemId: ${itemId}, lot: ${dto.lotNumber}`);
    return this.nats.send('commerce', 'site.goodsReceipts.addLot', { goodsReceiptId, itemId, ...dto });
  }

  // Changes a lot of a goods receipt item
  updateLot(
    goodsReceiptId: string,
    itemId: string,
    lotId: string,
    dto: UpdateGoodsReceiptLotDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.updateLot — lotId: ${lotId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.updateLot', { goodsReceiptId, itemId, lotId, ...dto });
  }

  // Removes a lot from a goods receipt item
  removeLot(goodsReceiptId: string, itemId: string, lotId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.removeLot — lotId: ${lotId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.removeLot', { goodsReceiptId, itemId, lotId });
  }

  // Returns a goods receipt item's lines for the data table with server-stored state
  async findLinesTable(
    goodsReceiptId: string,
    itemId: string,
    userId: string,
  ): Promise<GoodsReceiptLineTableResponseDto> {
    this.logger.log(`site.goodsReceipts.linesTable — itemId: ${itemId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
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

  // Returns the lines one lot of a goods receipt item is distributed to, for the data table
  async findLinesByLotTable(
    goodsReceiptId: string,
    itemId: string,
    lotId: string,
    userId: string,
  ): Promise<GoodsReceiptLineTableResponseDto> {
    this.logger.log(`site.goodsReceipts.linesByLotTable — itemId: ${itemId}, lotId: ${lotId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
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

  // Returns one line of a goods receipt item
  findLineById(goodsReceiptId: string, itemId: string, lineId: string): Promise<GoodsReceiptLineResponseDto> {
    this.logger.log(`site.goodsReceipts.lineById — lineId: ${lineId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.lineById', { goodsReceiptId, itemId, lineId });
  }

  // Adds a line to a goods receipt item
  addLine(
    goodsReceiptId: string,
    itemId: string,
    dto: AddGoodsReceiptLineDto,
  ): Promise<CreateResponseDto<GoodsReceiptLineResponseDto>> {
    this.logger.log(`site.goodsReceipts.addLine — itemId: ${itemId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.addLine', { goodsReceiptId, itemId, ...dto });
  }

  // Changes a line of a goods receipt item
  updateLine(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    dto: UpdateGoodsReceiptLineDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.updateLine — lineId: ${lineId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.updateLine', { goodsReceiptId, itemId, lineId, ...dto });
  }

  // Removes a line from a goods receipt item
  removeLine(goodsReceiptId: string, itemId: string, lineId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.removeLine — lineId: ${lineId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.removeLine', { goodsReceiptId, itemId, lineId });
  }

  // Returns the serials registered on a goods receipt line, for the data table
  async findLineItemsTable(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    userId: string,
  ): Promise<GoodsReceiptLineItemTableResponseDto> {
    this.logger.log(`site.goodsReceipts.lineItemsTable — lineId: ${lineId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
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

  // Registers a serial on a goods receipt line
  addLineItem(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    dto: AddGoodsReceiptLineItemDto,
  ): Promise<CreateResponseDto<GoodsReceiptLineItemResponseDto>> {
    this.logger.log(`site.goodsReceipts.addLineItem — lineId: ${lineId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.addLineItem', { goodsReceiptId, itemId, lineId, ...dto });
  }

  // Removes a serial from a goods receipt line
  removeLineItem(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    subItemId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.removeLineItem — subItemId: ${subItemId}`);
    return this.nats.send('commerce', 'site.goodsReceipts.removeLineItem', {
      goodsReceiptId,
      itemId,
      lineId,
      subItemId,
    });
  }
}
