import type { GoodsReceiptLotDto } from '@domain/goods-receipt-lots/dto/entity/goods-receipt-lot.dto';
import { AddGoodsReceiptLotDto } from '@domain/goods-receipt-lots/dto/request/add-goods-receipt-lot.dto';
import { UpdateGoodsReceiptLotDto } from '@domain/goods-receipt-lots/dto/request/update-goods-receipt-lot.dto';
import { GoodsReceiptLotsDomainService } from '@domain/goods-receipt-lots/services/goods-receipt-lots.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RpcLeCurrencyCode } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { GoodsReceiptsLotsService } from './services/goods-receipts-lots.service';

@Controller()
export class GoodsReceiptsLotsController {
  private readonly logger = new Logger(GoodsReceiptsLotsController.name);

  constructor(
    private readonly lotsService: GoodsReceiptLotsDomainService,
    private readonly service: GoodsReceiptsLotsService,
  ) {}

  // Returns the lots of a goods receipt item
  @MessagePattern({ cmd: 'site.goodsReceipts.lots' })
  lots(
    @Payload() data: { goodsReceiptId: string; itemId: string },
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<GoodsReceiptLotDto[]> {
    this.logger.log(`site.goodsReceipts.lots — item: ${data.itemId}`);
    return this.lotsService.findByItem(data.itemId, leCurrencyCode);
  }

  // Adds a lot to a goods receipt item
  @MessagePattern({ cmd: 'site.goodsReceipts.addLot' })
  addLot(
    @Payload() dto: AddGoodsReceiptLotDto,
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<CreateResponseDto<GoodsReceiptLotDto>> {
    this.logger.log(`site.goodsReceipts.addLot — item: ${dto.itemId}, lot: ${dto.lotNumber}`);
    return this.service.addLot(dto, leCurrencyCode);
  }

  // Changes a lot of a goods receipt item
  @MessagePattern({ cmd: 'site.goodsReceipts.updateLot' })
  updateLot(
    @Payload() dto: UpdateGoodsReceiptLotDto,
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.updateLot — lot: ${dto.lotId}`);
    return this.service.updateLot(dto, leCurrencyCode);
  }

  // Removes a lot from a goods receipt item
  @MessagePattern({ cmd: 'site.goodsReceipts.removeLot' })
  removeLot(@Payload() data: { goodsReceiptId: string; itemId: string; lotId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.removeLot — lot: ${data.lotId}`);
    return this.service.removeLot(data.goodsReceiptId, data.itemId, data.lotId);
  }
}
