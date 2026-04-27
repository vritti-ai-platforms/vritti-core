import { Injectable, Logger } from '@nestjs/common';
import { type CreateResponseDto, DataTableStateService, NatsClientService, type SuccessResponseDto } from '@vritti/api-sdk';
import type { AddGoodsReceiptItemDto } from '../dto/request/add-goods-receipt-item.dto';
import type { AddGoodsReceiptLineDto } from '../dto/request/add-goods-receipt-line.dto';
import type { AddGoodsReceiptLineItemDto } from '../dto/request/add-goods-receipt-line-item.dto';
import type { AddGoodsReceiptLotDto } from '../dto/request/add-goods-receipt-lot.dto';
import type { CreateGoodsReceiptDto } from '../dto/request/create-goods-receipt.dto';
import type { UpdateGoodsReceiptItemDto } from '../dto/request/update-goods-receipt-item.dto';
import type { UpdateGoodsReceiptLineDto } from '../dto/request/update-goods-receipt-line.dto';
import type { UpdateGoodsReceiptLineItemDto } from '../dto/request/update-goods-receipt-line-item.dto';
import type { UpdateGoodsReceiptLotDto } from '../dto/request/update-goods-receipt-lot.dto';
import type { GoodsReceiptItemResponseDto } from '../dto/response/goods-receipt-item-response.dto';
import type { GoodsReceiptItemTableResponseDto } from '../dto/response/goods-receipt-item-table-response.dto';
import type { GoodsReceiptLineItemResponseDto } from '../dto/response/goods-receipt-line-item-response.dto';
import type { GoodsReceiptLineItemTableResponseDto } from '../dto/response/goods-receipt-line-item-table-response.dto';
import type { GoodsReceiptLineResponseDto } from '../dto/response/goods-receipt-line-response.dto';
import type { GoodsReceiptLineTableResponseDto } from '../dto/response/goods-receipt-line-table-response.dto';
import type { GoodsReceiptLotResponseDto } from '../dto/response/goods-receipt-lot-response.dto';
import type { GoodsReceiptResponseDto } from '../dto/response/goods-receipt-response.dto';
import type { GoodsReceiptTableResponseDto } from '../dto/response/goods-receipt-table-response.dto';
import type { GoodsReceiptTreeNodeResponseDto } from '../dto/response/goods-receipt-tree-response.dto';

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
    return this.nats.send('commerce', 'goodsReceipts.create', dto);
  }

  async findForTable(userId: string): Promise<GoodsReceiptTableResponseDto> {
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-goods-receipts');
    const { result, count } = await this.nats.send<{ result: GoodsReceiptResponseDto[]; count: number }>(
      'commerce',
      'goodsReceipts.table',
      state,
    );
    return { result, count, state, activeViewId };
  }

  findById(id: string): Promise<GoodsReceiptResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.findById', { id });
  }

  findTree(goodsReceiptId: string): Promise<GoodsReceiptTreeNodeResponseDto[]> {
    this.logger.log(`goodsReceipts.tree — receipt: ${goodsReceiptId}`);
    return this.nats.send('commerce', 'goodsReceipts.tree', { goodsReceiptId });
  }

  publish(id: string): Promise<GoodsReceiptResponseDto> {
    this.logger.log(`goodsReceipts.publish — id: ${id}`);
    return this.nats.send('commerce', 'goodsReceipts.publish', { id });
  }

  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`goodsReceipts.delete — id: ${id}`);
    return this.nats.send('commerce', 'goodsReceipts.delete', { id });
  }

  // Items

  findInventoryItemIds(goodsReceiptId: string): Promise<string[]> {
    return this.nats.send('commerce', 'goodsReceipts.inventoryItemIds', { goodsReceiptId });
  }

  findItems(goodsReceiptId: string): Promise<GoodsReceiptItemResponseDto[]> {
    return this.nats.send('commerce', 'goodsReceipts.items', { goodsReceiptId });
  }

  async findItemsTable(goodsReceiptId: string, userId: string): Promise<GoodsReceiptItemTableResponseDto> {
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `goods-receipt-${goodsReceiptId}-items`,
    );
    const { result, count } = await this.nats.send<{ result: GoodsReceiptItemResponseDto[]; count: number }>(
      'commerce',
      'goodsReceipts.itemsTable',
      { goodsReceiptId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  findItemById(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItemResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.itemById', { goodsReceiptId, itemId });
  }

  addItem(
    goodsReceiptId: string,
    dto: AddGoodsReceiptItemDto,
  ): Promise<CreateResponseDto<GoodsReceiptItemResponseDto>> {
    return this.nats.send('commerce', 'goodsReceipts.addItem', { goodsReceiptId, ...dto });
  }

  updateItem(
    goodsReceiptId: string,
    itemId: string,
    dto: UpdateGoodsReceiptItemDto,
  ): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.updateItem', { goodsReceiptId, itemId, ...dto });
  }

  removeItem(goodsReceiptId: string, itemId: string): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.removeItem', { goodsReceiptId, itemId });
  }

  // Lots (item-scoped)

  findLots(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptLotResponseDto[]> {
    return this.nats.send('commerce', 'goodsReceipts.lots', { goodsReceiptId, itemId });
  }

  addLot(
    goodsReceiptId: string,
    itemId: string,
    dto: AddGoodsReceiptLotDto,
  ): Promise<CreateResponseDto<GoodsReceiptLotResponseDto>> {
    return this.nats.send('commerce', 'goodsReceipts.addLot', { goodsReceiptId, itemId, ...dto });
  }

  updateLot(
    goodsReceiptId: string,
    itemId: string,
    lotId: string,
    dto: UpdateGoodsReceiptLotDto,
  ): Promise<GoodsReceiptLotResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.updateLot', { goodsReceiptId, itemId, lotId, ...dto });
  }

  removeLot(goodsReceiptId: string, itemId: string, lotId: string): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.removeLot', { goodsReceiptId, itemId, lotId });
  }

  // Lines (item-scoped)

  findLines(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptLineResponseDto[]> {
    return this.nats.send('commerce', 'goodsReceipts.lines', { goodsReceiptId, itemId });
  }

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
      'goodsReceipts.linesTable',
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
      'goodsReceipts.linesByLotTable',
      { goodsReceiptId, itemId, lotId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  findLineById(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
  ): Promise<GoodsReceiptLineResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.lineById', { goodsReceiptId, itemId, lineId });
  }

  addLine(
    goodsReceiptId: string,
    itemId: string,
    dto: AddGoodsReceiptLineDto,
  ): Promise<CreateResponseDto<GoodsReceiptLineResponseDto>> {
    return this.nats.send('commerce', 'goodsReceipts.addLine', { goodsReceiptId, itemId, ...dto });
  }

  updateLine(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    dto: UpdateGoodsReceiptLineDto,
  ): Promise<GoodsReceiptLineResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.updateLine', { goodsReceiptId, itemId, lineId, ...dto });
  }

  removeLine(goodsReceiptId: string, itemId: string, lineId: string): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.removeLine', { goodsReceiptId, itemId, lineId });
  }

  // Line items (serials, line-scoped)

  findLineItems(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
  ): Promise<GoodsReceiptLineItemResponseDto[]> {
    return this.nats.send('commerce', 'goodsReceipts.lineItems', { goodsReceiptId, itemId, lineId });
  }

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
      'goodsReceipts.lineItemsTable',
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
    return this.nats.send('commerce', 'goodsReceipts.addLineItem', { goodsReceiptId, itemId, lineId, ...dto });
  }

  updateLineItem(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    subItemId: string,
    dto: UpdateGoodsReceiptLineItemDto,
  ): Promise<GoodsReceiptLineItemResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.updateLineItem', {
      goodsReceiptId,
      itemId,
      lineId,
      subItemId,
      ...dto,
    });
  }

  removeLineItem(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    subItemId: string,
  ): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.removeLineItem', { goodsReceiptId, itemId, lineId, subItemId });
  }
}
