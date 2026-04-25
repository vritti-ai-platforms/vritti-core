import { Injectable, Logger } from '@nestjs/common';
import { type CreateResponseDto, DataTableStateService, NatsClientService, type SuccessResponseDto } from '@vritti/api-sdk';
import type { AddGoodsReceiptBatchDto } from '../dto/request/add-goods-receipt-batch.dto';
import type { AddGoodsReceiptBatchItemDto } from '../dto/request/add-goods-receipt-batch-item.dto';
import type { AddGoodsReceiptItemDto } from '../dto/request/add-goods-receipt-item.dto';
import type { CreateGoodsReceiptDto } from '../dto/request/create-goods-receipt.dto';
import type { UpdateGoodsReceiptBatchDto } from '../dto/request/update-goods-receipt-batch.dto';
import type { UpdateGoodsReceiptBatchItemDto } from '../dto/request/update-goods-receipt-batch-item.dto';
import type { UpdateGoodsReceiptItemDto } from '../dto/request/update-goods-receipt-item.dto';
import type { GoodsReceiptBatchItemResponseDto } from '../dto/response/goods-receipt-batch-item-response.dto';
import type { GoodsReceiptBatchResponseDto } from '../dto/response/goods-receipt-batch-response.dto';
import type { GoodsReceiptItemResponseDto } from '../dto/response/goods-receipt-item-response.dto';
import type { GoodsReceiptItemTableResponseDto } from '../dto/response/goods-receipt-item-table-response.dto';
import type { GoodsReceiptResponseDto } from '../dto/response/goods-receipt-response.dto';
import type { GoodsReceiptTableResponseDto } from '../dto/response/goods-receipt-table-response.dto';

@Injectable()
export class GoodsReceiptsGatewayService {
  private readonly logger = new Logger(GoodsReceiptsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  async create(dto: CreateGoodsReceiptDto): Promise<CreateResponseDto<GoodsReceiptResponseDto>> {
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

  async findById(id: string): Promise<GoodsReceiptResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.findById', { id });
  }

  async findInventoryItemIds(goodsReceiptId: string): Promise<string[]> {
    return this.nats.send('commerce', 'goodsReceipts.inventoryItemIds', { goodsReceiptId });
  }

  async findItems(goodsReceiptId: string): Promise<GoodsReceiptItemResponseDto[]> {
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

  async findItemById(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItemResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.itemById', { goodsReceiptId, itemId });
  }

  async addItem(goodsReceiptId: string, dto: AddGoodsReceiptItemDto): Promise<CreateResponseDto<GoodsReceiptItemResponseDto>> {
    return this.nats.send('commerce', 'goodsReceipts.addItem', { goodsReceiptId, ...dto });
  }

  async updateItem(goodsReceiptId: string, itemId: string, dto: UpdateGoodsReceiptItemDto): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.updateItem', { goodsReceiptId, itemId, ...dto });
  }

  async removeItem(goodsReceiptId: string, itemId: string): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.removeItem', { goodsReceiptId, itemId });
  }

  async findBatches(goodsReceiptId: string, lineId: string): Promise<GoodsReceiptBatchResponseDto[]> {
    return this.nats.send('commerce', 'goodsReceipts.batches', { goodsReceiptId, lineId });
  }

  async findBatchById(goodsReceiptId: string, lineId: string, batchId: string): Promise<GoodsReceiptBatchResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.batchById', { goodsReceiptId, lineId, batchId });
  }

  async addBatch(
    goodsReceiptId: string,
    lineId: string,
    dto: AddGoodsReceiptBatchDto,
  ): Promise<CreateResponseDto<GoodsReceiptBatchResponseDto>> {
    return this.nats.send('commerce', 'goodsReceipts.addBatch', { goodsReceiptId, lineId, ...dto });
  }

  async updateBatch(
    goodsReceiptId: string,
    lineId: string,
    batchId: string,
    dto: UpdateGoodsReceiptBatchDto,
  ): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.updateBatch', { goodsReceiptId, lineId, batchId, ...dto });
  }

  async removeBatch(goodsReceiptId: string, lineId: string, batchId: string): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.removeBatch', { goodsReceiptId, lineId, batchId });
  }

  async findBatchItems(goodsReceiptId: string, lineId: string, batchId: string): Promise<GoodsReceiptBatchItemResponseDto[]> {
    return this.nats.send('commerce', 'goodsReceipts.batchItems', { goodsReceiptId, lineId, batchId });
  }

  async addBatchItem(
    goodsReceiptId: string,
    lineId: string,
    batchId: string,
    dto: AddGoodsReceiptBatchItemDto,
  ): Promise<CreateResponseDto<GoodsReceiptBatchItemResponseDto>> {
    return this.nats.send('commerce', 'goodsReceipts.addBatchItem', { goodsReceiptId, lineId, batchId, ...dto });
  }

  async updateBatchItem(
    goodsReceiptId: string,
    lineId: string,
    batchId: string,
    itemId: string,
    dto: UpdateGoodsReceiptBatchItemDto,
  ): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.updateBatchItem', { goodsReceiptId, lineId, batchId, itemId, ...dto });
  }

  async removeBatchItem(
    goodsReceiptId: string,
    lineId: string,
    batchId: string,
    itemId: string,
  ): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'goodsReceipts.removeBatchItem', { goodsReceiptId, lineId, batchId, itemId });
  }

  async publish(id: string): Promise<GoodsReceiptResponseDto> {
    this.logger.log(`goodsReceipts.publish — id: ${id}`);
    return this.nats.send('commerce', 'goodsReceipts.publish', { id });
  }

  async startAllocation(id: string): Promise<GoodsReceiptResponseDto> {
    this.logger.log(`goodsReceipts.startAllocation — id: ${id}`);
    return this.nats.send('commerce', 'goodsReceipts.startAllocation', { id });
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`goodsReceipts.delete — id: ${id}`);
    return this.nats.send('commerce', 'goodsReceipts.delete', { id });
  }
}
