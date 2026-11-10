import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import { AddGoodsReceiptPurchaseOrderDto } from '@domain/goods-receipts/dto/request/add-goods-receipt-purchase-order.dto';
import { CreateGoodsReceiptFromDeliveryDto } from '@domain/goods-receipts/dto/request/create-goods-receipt-from-delivery.dto';
import { CreateGoodsReceiptFromPurchaseOrdersDto } from '@domain/goods-receipts/dto/request/create-goods-receipt-from-purchase-orders.dto';
import { UpdateGoodsReceiptDto } from '@domain/goods-receipts/dto/request/update-goods-receipt.dto';
import { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { GoodsReceiptsPublishService } from '@/modules/site/goods-receipts/root/services/goods-receipts-publish.service';
import { GoodsReceiptsService } from '@/modules/site/goods-receipts/root/services/goods-receipts-root.service';

@Controller()
export class LeGoodsReceiptsRootController {
  private readonly logger = new Logger(LeGoodsReceiptsRootController.name);

  constructor(
    private readonly goodsReceiptsService: GoodsReceiptsDomainService,
    private readonly service: GoodsReceiptsService,
    private readonly publishService: GoodsReceiptsPublishService,
  ) {}

  // Creates a draft goods receipt of an announced inbound delivery, pre-filled with its open lines
  @MessagePattern({ cmd: 'le.goodsReceipts.createFromDelivery' })
  createFromDelivery(@Payload() dto: CreateGoodsReceiptFromDeliveryDto): Promise<CreateResponseDto<GoodsReceiptDto>> {
    this.logger.log(`le.goodsReceipts.createFromDelivery — delivery: ${dto.inboundDeliveryId}`);
    return this.service.createFromDelivery(dto);
  }

  // Creates an arrived inbound delivery of a supplier's purchase orders and a draft goods receipt of it, pre-filled with their open lines
  @MessagePattern({ cmd: 'le.goodsReceipts.createFromPurchaseOrders' })
  createFromPurchaseOrders(
    @Payload() dto: CreateGoodsReceiptFromPurchaseOrdersDto,
  ): Promise<CreateResponseDto<GoodsReceiptDto>> {
    this.logger.log(
      `le.goodsReceipts.createFromPurchaseOrders — supplier: ${dto.supplierId}, POs: ${dto.purchaseOrderIds.length}`,
    );
    return this.service.createFromPurchaseOrders(dto);
  }

  // Adds the open lines of another purchase order of the supplier to a draft goods receipt and its inbound delivery
  @MessagePattern({ cmd: 'le.goodsReceipts.addPurchaseOrder' })
  addPurchaseOrder(@Payload() dto: AddGoodsReceiptPurchaseOrderDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.goodsReceipts.addPurchaseOrder — receipt: ${dto.goodsReceiptId}, PO: ${dto.purchaseOrderId}`);
    return this.service.addPurchaseOrder(dto);
  }

  // Changes a draft goods receipt's notes and the supplier's delivery note on the inbound delivery it created
  @MessagePattern({ cmd: 'le.goodsReceipts.update' })
  update(@Payload() dto: UpdateGoodsReceiptDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.goodsReceipts.update — id: ${dto.id}`);
    return this.service.update(dto);
  }

  // Returns one page of the goods receipts of the legal entity's sites
  @MessagePattern({ cmd: 'le.goodsReceipts.table' })
  table(@Payload() state: TableState): Promise<{ result: GoodsReceiptDto[]; count: number }> {
    this.logger.log('le.goodsReceipts.table');
    return this.goodsReceiptsService.findForTable(state);
  }

  // Returns one goods receipt
  @MessagePattern({ cmd: 'le.goodsReceipts.findById' })
  findById(@Payload() data: { id: string }): Promise<GoodsReceiptDto> {
    this.logger.log(`le.goodsReceipts.findById — id: ${data.id}`);
    return this.goodsReceiptsService.findById(data.id);
  }

  // Publishes a goods receipt, landing its stock at its site
  @MessagePattern({ cmd: 'le.goodsReceipts.publish' })
  publish(
    @Payload() data: { id: string; leCurrencyCode: string },
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<GoodsReceiptDto> {
    this.logger.log(`le.goodsReceipts.publish — id: ${data.id}`);
    return this.publishService.publish(data.id, data.leCurrencyCode, headers);
  }

  // Deletes a draft goods receipt, with the inbound delivery it created
  @MessagePattern({ cmd: 'le.goodsReceipts.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`le.goodsReceipts.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
