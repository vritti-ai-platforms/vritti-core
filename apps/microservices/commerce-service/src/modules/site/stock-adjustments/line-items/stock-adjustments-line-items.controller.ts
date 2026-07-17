import type { StockAdjustmentLineItemDto } from '@domain/stock-adjustment-line-items/dto/entity/stock-adjustment-line-item.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { AddLineItemDto } from '../root/dto/request/add-line-item.dto';
import { UpdateLineItemDto } from '../root/dto/request/update-line-item.dto';
import { StockAdjustmentsLineItemsTransactionService } from './services/stock-adjustments-line-items-transaction.service';

@Controller()
export class StockAdjustmentsLineItemsController {
  private readonly logger = new Logger(StockAdjustmentsLineItemsController.name);

  constructor(private readonly service: StockAdjustmentsLineItemsTransactionService) {}

  @MessagePattern({ cmd: 'site.stockAdjustments.lineItemsTable' })
  lineItemsTable(
    @Payload() data: { adjustmentId: string; lineId: string } & TableViewState,
  ): Promise<{ result: StockAdjustmentLineItemDto[]; count: number }> {
    this.logger.log(`stockAdjustments.lineItemsTable — line: ${data.lineId}`);
    return this.service.lineItemsTable(data);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.addLineItem' })
  addLineItem(@Payload() dto: AddLineItemDto): Promise<CreateResponseDto<StockAdjustmentLineItemDto>> {
    this.logger.log(`stockAdjustments.addLineItem — line: ${dto.lineId}`);
    return this.service.addLineItem(dto);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.updateLineItem' })
  updateLineItem(@Payload() dto: UpdateLineItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.updateLineItem — item: ${dto.itemId}`);
    return this.service.updateLineItem(dto);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.removeLineItem' })
  removeLineItem(
    @Payload() data: { adjustmentId: string; lineId: string; itemId: string },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.removeLineItem — item: ${data.itemId}`);
    return this.service.removeLineItem(data);
  }
}
