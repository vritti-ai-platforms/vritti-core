import type { GoodsReceiptLotDto } from '@domain/goods-receipt-lots/dto/entity/goods-receipt-lot.dto';
import { GoodsReceiptLotsService } from '@domain/goods-receipt-lots/services/goods-receipt-lots.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk';

@Controller()
export class GoodsReceiptsLotsController {
  private readonly logger = new Logger(GoodsReceiptsLotsController.name);

  constructor(private readonly service: GoodsReceiptLotsService) {}

  @MessagePattern({ cmd: 'goodsReceipts.lots' })
  lots(@Payload() data: { goodsReceiptId: string; itemId: string }): Promise<GoodsReceiptLotDto[]> {
    this.logger.log(`goodsReceipts.lots — item: ${data.itemId}`);
    return this.service.listByItem(data.goodsReceiptId, data.itemId);
  }

  @MessagePattern({ cmd: 'goodsReceipts.addLot' })
  addLot(
    @Payload()
    data: {
      goodsReceiptId: string;
      itemId: string;
      lotNumber: string;
      manufacturingDate?: string | null;
      expiryDate?: string | null;
    },
  ): Promise<CreateResponseDto<GoodsReceiptLotDto>> {
    this.logger.log(`goodsReceipts.addLot — item: ${data.itemId}`);
    return this.service.addLot(data.goodsReceiptId, data.itemId, {
      lotNumber: data.lotNumber,
      manufacturingDate: data.manufacturingDate,
      expiryDate: data.expiryDate,
    });
  }

  @MessagePattern({ cmd: 'goodsReceipts.updateLot' })
  updateLot(
    @Payload()
    data: {
      goodsReceiptId: string;
      itemId: string;
      lotId: string;
      lotNumber?: string;
      manufacturingDate?: string | null;
      expiryDate?: string | null;
    },
  ): Promise<GoodsReceiptLotDto> {
    this.logger.log(`goodsReceipts.updateLot — lot: ${data.lotId}`);
    return this.service.updateLot(data.goodsReceiptId, data.itemId, data.lotId, {
      lotNumber: data.lotNumber,
      manufacturingDate: data.manufacturingDate,
      expiryDate: data.expiryDate,
    });
  }

  @MessagePattern({ cmd: 'goodsReceipts.removeLot' })
  removeLot(
    @Payload() data: { goodsReceiptId: string; itemId: string; lotId: string },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`goodsReceipts.removeLot — lot: ${data.lotId}`);
    return this.service.removeLot(data.goodsReceiptId, data.itemId, data.lotId);
  }
}
