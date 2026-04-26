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
  type TableViewState,
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

  @MessagePattern({ cmd: 'stockAdjustments.linesTable' })
  linesTable(
    @Payload() data: { adjustmentId: string } & TableViewState,
  ): Promise<{ result: StockAdjustmentLineDto[]; count: number }> {
    this.logger.log(`stockAdjustments.linesTable — adjustment: ${data.adjustmentId}`);
    const { adjustmentId, ...state } = data;
    return this.service.findForTable(adjustmentId, state);
  }

  @MessagePattern({ cmd: 'stockAdjustments.linesByLotTable' })
  linesByLotTable(
    @Payload() data: { adjustmentId: string; lotId: string } & TableViewState,
  ): Promise<{ result: StockAdjustmentLineDto[]; count: number }> {
    this.logger.log(`stockAdjustments.linesByLotTable — adjustment: ${data.adjustmentId}, lot: ${data.lotId}`);
    const { adjustmentId, lotId, ...state } = data;
    return this.service.findForTable(adjustmentId, state, lotId);
  }

  @MessagePattern({ cmd: 'stockAdjustments.linesByLot' })
  linesByLot(@Payload() data: { adjustmentId: string; lotId: string }): Promise<StockAdjustmentLineDto[]> {
    this.logger.log(`stockAdjustments.linesByLot — adjustment: ${data.adjustmentId}, lot: ${data.lotId}`);
    return this.service.findByLotId(data.adjustmentId, data.lotId);
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
      stockAdjustmentLotId?: string | null;
      locationId?: string | null;
      quantId?: string | null;
      quantity: number;
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
      stockAdjustmentLotId?: string | null;
      locationId?: string | null;
      quantId?: string | null;
    },
  ): Promise<StockAdjustmentLineDto> {
    this.logger.log(`stockAdjustments.updateLine — line: ${data.lineId}`);
    return this.service.updateLineByAdjustmentId(data.adjustmentId, data.lineId, {
      quantity: data.quantity,
      stockAdjustmentLotId: data.stockAdjustmentLotId,
      locationId: data.locationId,
      quantId: data.quantId,
    });
  }

  @MessagePattern({ cmd: 'stockAdjustments.removeLine' })
  removeLine(@Payload() data: { adjustmentId: string; lineId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.removeLine — line: ${data.lineId}`);
    return this.service.removeLineByAdjustmentId(data.adjustmentId, data.lineId);
  }
}
