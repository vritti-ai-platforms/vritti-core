import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import { CreateGoodsReceiptFromDeliveryDto } from '@domain/goods-receipts/dto/request/create-goods-receipt-from-delivery.dto';
import { UpdateGoodsReceiptDto } from '@domain/goods-receipts/dto/request/update-goods-receipt.dto';
import { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { GoodsReceiptsPostService } from '@/modules/site/goods-receipts/root/services/goods-receipts-post.service';
import { GoodsReceiptsService } from '@/modules/site/goods-receipts/root/services/goods-receipts-root.service';

@Controller()
export class LeGoodsReceiptsRootController {
  private readonly logger = new Logger(LeGoodsReceiptsRootController.name);

  constructor(
    private readonly goodsReceiptsService: GoodsReceiptsDomainService,
    private readonly service: GoodsReceiptsService,
    private readonly postService: GoodsReceiptsPostService,
  ) {}

  // Creates a draft goods receipt of an inbound delivery, pre-filled with its open lines; the only way to start a receipt
  @MessagePattern({ cmd: 'le.goodsReceipts.createFromDelivery' })
  createFromDelivery(@Payload() dto: CreateGoodsReceiptFromDeliveryDto): Promise<CreateResponseDto<GoodsReceiptDto>> {
    this.logger.log(`le.goodsReceipts.createFromDelivery — delivery: ${dto.inboundDeliveryId}`);
    return this.service.createFromDelivery(dto);
  }

  // Changes a draft goods receipt's notes
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

  // Posts a goods receipt, landing its stock at its site
  @MessagePattern({ cmd: 'le.goodsReceipts.post' })
  post(@Payload() data: { id: string }, @RpcNatsHeaders() headers: NatsHeaders): Promise<GoodsReceiptDto> {
    this.logger.log(`le.goodsReceipts.post — id: ${data.id}`);
    return this.postService.post(data.id, headers.leCurrencyCode, headers);
  }

  // Deletes a draft goods receipt
  @MessagePattern({ cmd: 'le.goodsReceipts.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`le.goodsReceipts.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
