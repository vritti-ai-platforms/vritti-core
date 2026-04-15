import type { StockAdjustmentLineItemDto } from '@domain/stock-adjustment-line-items/dto/entity/stock-adjustment-line-item.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk';
import { StockAdjustmentsLineItemsTransactionService } from './services/stock-adjustments-line-items-transaction.service';

@Controller()
export class StockAdjustmentsLineItemsController {
  private readonly logger = new Logger(StockAdjustmentsLineItemsController.name);

  constructor(private readonly service: StockAdjustmentsLineItemsTransactionService) {}

  @MessagePattern({ cmd: 'stockAdjustments.lineItems' })
  lineItems(@Payload() data: { adjustmentId: string; lineId: string }): Promise<StockAdjustmentLineItemDto[]> {
    this.logger.log(`stockAdjustments.lineItems — line: ${data.lineId}`);
    return this.service.lineItems(data.adjustmentId, data.lineId);
  }

  @MessagePattern({ cmd: 'stockAdjustments.addLineItem' })
  addLineItem(@Payload() data: { adjustmentId: string; lineId: string; quantity: number }): Promise<StockAdjustmentLineItemDto> {
    this.logger.log(`stockAdjustments.addLineItem — line: ${data.lineId}`);
    return this.service.addLineItem(data);
  }

  @MessagePattern({ cmd: 'stockAdjustments.updateLineItem' })
  updateLineItem(
    @Payload() data: { adjustmentId: string; lineId: string; itemId: string; quantity: number },
  ): Promise<StockAdjustmentLineItemDto> {
    this.logger.log(`stockAdjustments.updateLineItem — item: ${data.itemId}`);
    return this.service.updateLineItem(data);
  }

  @MessagePattern({ cmd: 'stockAdjustments.removeLineItem' })
  removeLineItem(@Payload() data: { adjustmentId: string; lineId: string; itemId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.removeLineItem — item: ${data.itemId}`);
    return this.service.removeLineItem(data);
  }
}
