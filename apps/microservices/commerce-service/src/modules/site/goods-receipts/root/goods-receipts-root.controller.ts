import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import type { GoodsReceiptCountsDto } from '@domain/goods-receipts/dto/entity/goods-receipt-counts.dto';
import { CreateGoodsReceiptFromDeliveryDto } from '@domain/goods-receipts/dto/request/create-goods-receipt-from-delivery.dto';
import { UpdateGoodsReceiptDto } from '@domain/goods-receipts/dto/request/update-goods-receipt.dto';
import {
  type GoodsReceiptFeed,
  type GoodsReceiptFeedQuery,
  GoodsReceiptsDomainService,
} from '@domain/goods-receipts/services/goods-receipts.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { GoodsReceiptsPostService } from './services/goods-receipts-post.service';
import { GoodsReceiptsService } from './services/goods-receipts-root.service';

@Controller()
export class GoodsReceiptsRootController {
  private readonly logger = new Logger(GoodsReceiptsRootController.name);

  constructor(
    private readonly goodsReceiptsService: GoodsReceiptsDomainService,
    private readonly service: GoodsReceiptsService,
    private readonly postService: GoodsReceiptsPostService,
  ) {}

  // Creates a draft goods receipt of an inbound delivery, pre-filled with its open lines; the only way to start a receipt
  @MessagePattern({ cmd: 'site.goodsReceipts.createFromDelivery' })
  createFromDelivery(@Payload() dto: CreateGoodsReceiptFromDeliveryDto): Promise<CreateResponseDto<GoodsReceiptDto>> {
    this.logger.log(`site.goodsReceipts.createFromDelivery — delivery: ${dto.inboundDeliveryId}`);
    return this.service.createFromDelivery(dto);
  }

  // Changes a draft goods receipt's notes
  @MessagePattern({ cmd: 'site.goodsReceipts.update' })
  update(@Payload() dto: UpdateGoodsReceiptDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.update — id: ${dto.id}`);
    return this.service.update(dto);
  }

  // Posts a goods receipt, landing its stock at the site
  @MessagePattern({ cmd: 'site.goodsReceipts.post' })
  post(@Payload() data: { id: string }, @RpcNatsHeaders() headers: NatsHeaders): Promise<GoodsReceiptDto> {
    this.logger.log(`site.goodsReceipts.post — id: ${data.id}`);
    return this.postService.post(data.id, headers.leCurrencyCode, headers);
  }

  // Returns one goods receipt
  @MessagePattern({ cmd: 'site.goodsReceipts.findById' })
  findById(@Payload() data: { id: string }): Promise<GoodsReceiptDto> {
    this.logger.log(`site.goodsReceipts.findById — id: ${data.id}`);
    return this.goodsReceiptsService.findById(data.id);
  }

  // Returns one page of the site's goods receipts
  @MessagePattern({ cmd: 'site.goodsReceipts.table' })
  table(@Payload() state: TableState): Promise<{ result: GoodsReceiptDto[]; count: number }> {
    this.logger.log('site.goodsReceipts.table');
    return this.goodsReceiptsService.findForTable(state);
  }

  // Returns a keyset page of the site's goods receipts for the mobile feed
  @MessagePattern({ cmd: 'site.goodsReceipts.feed' })
  feed(@Payload() query: GoodsReceiptFeedQuery): Promise<GoodsReceiptFeed> {
    this.logger.log('site.goodsReceipts.feed');
    return this.goodsReceiptsService.findForFeed(query);
  }

  // Counts a goods receipt's items, one per tab of its detail page
  @MessagePattern({ cmd: 'site.goodsReceipts.findCounts' })
  findCounts(@Payload() data: { id: string }): Promise<GoodsReceiptCountsDto> {
    this.logger.log(`site.goodsReceipts.findCounts — id: ${data.id}`);
    return this.goodsReceiptsService.findCounts(data.id);
  }

  // Deletes a draft goods receipt
  @MessagePattern({ cmd: 'site.goodsReceipts.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
