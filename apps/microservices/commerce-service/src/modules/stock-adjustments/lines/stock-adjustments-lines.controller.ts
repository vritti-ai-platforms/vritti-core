import type { StockAdjustmentLineDto } from '@domain/stock-adjustment-lines/dto/entity/stock-adjustment-line.dto';
import { StockAdjustmentLinesService } from '@domain/stock-adjustment-lines/services/stock-adjustment-lines.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  BadRequestException,
  type CreateResponseDto,
  type NatsHeaders,
  RpcNatsHeaders,
  type SuccessResponseDto,
} from '@vritti/api-sdk';

@Controller()
export class StockAdjustmentsLinesController {
  private readonly logger = new Logger(StockAdjustmentsLinesController.name);

  constructor(private readonly service: StockAdjustmentLinesService) {}

  @MessagePattern({ cmd: 'stockAdjustments.lines' })
  lines(@Payload() data: { adjustmentId: string }): Promise<StockAdjustmentLineDto[]> {
    this.logger.log(`stockAdjustments.lines — adjustment: ${data.adjustmentId}`);
    return this.service.findByAdjustmentId(data.adjustmentId);
  }

  @MessagePattern({ cmd: 'stockAdjustments.lineById' })
  lineById(@Payload() data: { adjustmentId: string; lineId: string }): Promise<StockAdjustmentLineDto> {
    this.logger.log(`stockAdjustments.lineById — adjustment: ${data.adjustmentId}, line: ${data.lineId}`);
    return this.service.findById(data.adjustmentId, data.lineId);
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
  ): Promise<CreateResponseDto<StockAdjustmentLineDto>> {
    this.logger.log(`stockAdjustments.addLine — adjustment: ${data.adjustmentId}`);
    if (!headers.userId) {
      throw new BadRequestException('User ID is required to add adjustment lines.');
    }
    return this.service.addLineByAdjustmentId(data.adjustmentId, { ...data, createdById: headers.userId });
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
    return this.service.updateLineByAdjustmentId(data.adjustmentId, data.lineId, {
      quantity: data.quantity,
      locationId: data.locationId,
      manufacturingDate: data.manufacturingDate,
      expiryDate: data.expiryDate,
    });
  }

  @MessagePattern({ cmd: 'stockAdjustments.removeLine' })
  removeLine(@Payload() data: { adjustmentId: string; lineId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.removeLine — line: ${data.lineId}`);
    return this.service.removeLineByAdjustmentId(data.adjustmentId, data.lineId);
  }
}
