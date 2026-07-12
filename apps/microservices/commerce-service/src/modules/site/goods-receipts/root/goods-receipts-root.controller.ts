import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import { GoodsReceiptsService } from '@domain/goods-receipts/services/goods-receipts.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SearchState, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { RpcSiteCurrencyCode } from '@vritti/api-sdk/nats';
import type { CreateGoodsReceiptDto } from '../dto/request/create-goods-receipt.dto';
import { GoodsReceiptsPublishService } from './services/goods-receipts-publish.service';

@Controller()
export class GoodsReceiptsRootController {
  private readonly logger = new Logger(GoodsReceiptsRootController.name);

  constructor(
    private readonly service: GoodsReceiptsService,
    private readonly publishService: GoodsReceiptsPublishService,
  ) {}

  @MessagePattern({ cmd: 'site.goodsReceipts.create' })
  create(
    @Payload() dto: CreateGoodsReceiptDto,
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<CreateResponseDto<GoodsReceiptDto>> {
    this.logger.log(`goodsReceipts.create — supplier: ${dto.supplierId}`);
    return this.service.create(dto, siteCurrencyCode);
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.table' })
  table(@Payload() state: TableViewState): Promise<{ result: GoodsReceiptDto[]; count: number }> {
    this.logger.log('goodsReceipts.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.feed' })
  feed(@Payload() query: { search?: SearchState | null; limit?: number; cursor?: string }): Promise<{
    edges: { cursor: string; node: GoodsReceiptDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log('goodsReceipts.feed');
    return this.service.findForFeed(query);
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.findById' })
  findById(@Payload() data: { id: string }): Promise<GoodsReceiptDto> {
    this.logger.log('goodsReceipts.findById');
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.publish' })
  publish(@Payload() data: { id: string }, @RpcSiteCurrencyCode() siteCurrencyCode: string): Promise<GoodsReceiptDto> {
    this.logger.log(`goodsReceipts.publish — site currency: ${siteCurrencyCode}`);
    return this.publishService.publish(data.id, siteCurrencyCode);
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.linkPo' })
  linkPurchaseOrder(@Payload() data: { id: string; purchaseOrderId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`goodsReceipts.linkPo — id: ${data.id}, po: ${data.purchaseOrderId}`);
    return this.service.linkPurchaseOrder(data.id, data.purchaseOrderId);
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.unlinkPo' })
  unlinkPurchaseOrder(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`goodsReceipts.unlinkPo — id: ${data.id}`);
    return this.service.unlinkPurchaseOrder(data.id);
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log('goodsReceipts.delete');
    return this.service.delete(data.id);
  }
}
