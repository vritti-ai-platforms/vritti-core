import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import { AddGoodsReceiptPurchaseOrderDto } from '@domain/goods-receipts/dto/request/add-goods-receipt-purchase-order.dto';
import { CreateGoodsReceiptFromDeliveryDto } from '@domain/goods-receipts/dto/request/create-goods-receipt-from-delivery.dto';
import { CreateGoodsReceiptFromPurchaseOrdersDto } from '@domain/goods-receipts/dto/request/create-goods-receipt-from-purchase-orders.dto';
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
import { GoodsReceiptsPublishService } from './services/goods-receipts-publish.service';
import { GoodsReceiptsService } from './services/goods-receipts-root.service';

@Controller()
export class GoodsReceiptsRootController {
  private readonly logger = new Logger(GoodsReceiptsRootController.name);

  constructor(
    private readonly goodsReceiptsService: GoodsReceiptsDomainService,
    private readonly service: GoodsReceiptsService,
    private readonly publishService: GoodsReceiptsPublishService,
  ) {}

  // Creates a draft goods receipt of an announced inbound delivery, pre-filled with its open lines
  @MessagePattern({ cmd: 'site.goodsReceipts.createFromDelivery' })
  createFromDelivery(@Payload() dto: CreateGoodsReceiptFromDeliveryDto): Promise<CreateResponseDto<GoodsReceiptDto>> {
    this.logger.log(`site.goodsReceipts.createFromDelivery — delivery: ${dto.inboundDeliveryId}`);
    return this.service.createFromDelivery(dto);
  }

  // Creates an arrived inbound delivery of a supplier's purchase orders and a draft goods receipt of it, pre-filled with their open lines
  @MessagePattern({ cmd: 'site.goodsReceipts.createFromPurchaseOrders' })
  createFromPurchaseOrders(
    @Payload() dto: CreateGoodsReceiptFromPurchaseOrdersDto,
  ): Promise<CreateResponseDto<GoodsReceiptDto>> {
    this.logger.log(
      `site.goodsReceipts.createFromPurchaseOrders — supplier: ${dto.supplierId}, POs: ${dto.purchaseOrderIds.length}`,
    );
    return this.service.createFromPurchaseOrders(dto);
  }

  // Adds the open lines of another purchase order of the supplier to a draft goods receipt and its inbound delivery
  @MessagePattern({ cmd: 'site.goodsReceipts.addPurchaseOrder' })
  addPurchaseOrder(@Payload() dto: AddGoodsReceiptPurchaseOrderDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.addPurchaseOrder — receipt: ${dto.goodsReceiptId}, PO: ${dto.purchaseOrderId}`);
    return this.service.addPurchaseOrder(dto);
  }

  // Changes a draft goods receipt's notes and the supplier's delivery note on the inbound delivery it created
  @MessagePattern({ cmd: 'site.goodsReceipts.update' })
  update(@Payload() dto: UpdateGoodsReceiptDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.update — id: ${dto.id}`);
    return this.service.update(dto);
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

  // Returns one goods receipt
  @MessagePattern({ cmd: 'site.goodsReceipts.findById' })
  findById(@Payload() data: { id: string }): Promise<GoodsReceiptDto> {
    this.logger.log(`site.goodsReceipts.findById — id: ${data.id}`);
    return this.goodsReceiptsService.findById(data.id);
  }

  // Publishes a goods receipt, landing its stock at the site
  @MessagePattern({ cmd: 'site.goodsReceipts.publish' })
  publish(@Payload() data: { id: string }, @RpcNatsHeaders() headers: NatsHeaders): Promise<GoodsReceiptDto> {
    this.logger.log(`site.goodsReceipts.publish — id: ${data.id}`);
    return this.publishService.publish(data.id, headers.siteCurrencyCode, headers);
  }

  // Deletes a draft goods receipt, with the inbound delivery it created
  @MessagePattern({ cmd: 'site.goodsReceipts.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
