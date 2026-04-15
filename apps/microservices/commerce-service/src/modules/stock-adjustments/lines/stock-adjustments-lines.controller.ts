import type { StockAdjustmentLineDto } from '@domain/stock-adjustment-lines/dto/entity/stock-adjustment-line.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BadRequestException, type NatsHeaders, RpcNatsHeaders, type SuccessResponseDto } from '@vritti/api-sdk';
import { StockAdjustmentLinesTransactionService } from './services/stock-adjustment-lines-transaction.service';

@Controller()
export class StockAdjustmentsLinesController {
  private readonly logger = new Logger(StockAdjustmentsLinesController.name);

  constructor(private readonly service: StockAdjustmentLinesTransactionService) {}

  @MessagePattern({ cmd: 'stockAdjustments.lines' })
  lines(@Payload() data: { adjustmentId: string }): Promise<StockAdjustmentLineDto[]> {
    this.logger.log(`stockAdjustments.lines — adjustment: ${data.adjustmentId}`);
    return this.service.lines(data.adjustmentId);
  }

  @MessagePattern({ cmd: 'stockAdjustments.lineById' })
  lineById(@Payload() data: { adjustmentId: string; lineId: string }): Promise<StockAdjustmentLineDto> {
    this.logger.log(`stockAdjustments.lineById — adjustment: ${data.adjustmentId}, line: ${data.lineId}`);
    return this.service.lineById(data.adjustmentId, data.lineId);
  }

  @MessagePattern({ cmd: 'stockAdjustments.addLine' })
  addLine(
    @Payload() data: {
      adjustmentId: string;
      batchId?: string;
      locationId?: string;
      quantity: number;
      manufacturingDate?: string;
      expiryDate?: string;
    },
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<StockAdjustmentLineDto> {
    this.logger.log(`stockAdjustments.addLine — adjustment: ${data.adjustmentId}`);
    if (!headers.userId) {
      throw new BadRequestException('User ID is required to add adjustment lines.');
    }
    return this.service.addLine({ ...data, createdById: headers.userId });
  }

  @MessagePattern({ cmd: 'stockAdjustments.updateLine' })
  updateLine(
    @Payload() data: {
      adjustmentId: string;
      lineId: string;
      quantity?: number;
      locationId?: string;
      manufacturingDate?: string;
      expiryDate?: string;
    },
  ): Promise<StockAdjustmentLineDto> {
    this.logger.log(`stockAdjustments.updateLine — line: ${data.lineId}`);
    return this.service.updateLine(data);
  }

  @MessagePattern({ cmd: 'stockAdjustments.removeLine' })
  removeLine(@Payload() data: { adjustmentId: string; lineId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.removeLine — line: ${data.lineId}`);
    return this.service.removeLine(data);
  }
}
