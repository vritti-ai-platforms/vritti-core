import { AddChangeLineDto } from '@domain/stock-adjustment-lines/dto/request/add-change-line.dto';
import { AddOpeningLineDto } from '@domain/stock-adjustment-lines/dto/request/add-opening-line.dto';
import { UpdateChangeLineDto } from '@domain/stock-adjustment-lines/dto/request/update-change-line.dto';
import { UpdateOpeningLineDto } from '@domain/stock-adjustment-lines/dto/request/update-opening-line.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { StockAdjustmentLineWithDisplayDto } from './dto/entity/stock-adjustment-line-with-display.dto';
import { StockAdjustmentsLinesService } from './services/stock-adjustments-lines.service';

@Controller()
export class StockAdjustmentsLinesController {
  private readonly logger = new Logger(StockAdjustmentsLinesController.name);

  constructor(private readonly appService: StockAdjustmentsLinesService) {}

  @MessagePattern({ cmd: 'site.stockAdjustments.addOpeningLine' })
  addOpeningLine(@Payload() dto: AddOpeningLineDto): Promise<CreateResponseDto<StockAdjustmentLineWithDisplayDto>> {
    this.logger.log(`stockAdjustments.addOpeningLine — adjustment: ${dto.adjustmentId}`);
    const { adjustmentId, ...rest } = dto;
    return this.appService.addOpeningLine(adjustmentId, rest);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.addChangeLine' })
  addChangeLine(@Payload() dto: AddChangeLineDto): Promise<CreateResponseDto<StockAdjustmentLineWithDisplayDto>> {
    this.logger.log(`stockAdjustments.addChangeLine — adjustment: ${dto.adjustmentId}`);
    const { adjustmentId, ...rest } = dto;
    return this.appService.addChangeLine(adjustmentId, rest);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.updateOpeningLine' })
  updateOpeningLine(@Payload() dto: UpdateOpeningLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.updateOpeningLine — line: ${dto.lineId}`);
    const { adjustmentId, lineId, ...rest } = dto;
    return this.appService.updateOpeningLine(adjustmentId, lineId, rest);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.updateChangeLine' })
  updateChangeLine(@Payload() dto: UpdateChangeLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.updateChangeLine — line: ${dto.lineId}`);
    const { adjustmentId, lineId, ...rest } = dto;
    return this.appService.updateChangeLine(adjustmentId, lineId, rest);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.lineById' })
  lineById(@Payload() data: { adjustmentId: string; lineId: string }): Promise<StockAdjustmentLineWithDisplayDto> {
    this.logger.log(`stockAdjustments.lineById — adjustment: ${data.adjustmentId}, line: ${data.lineId}`);
    return this.appService.findById(data.adjustmentId, data.lineId);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.linesTable' })
  linesTable(
    @Payload() data: { adjustmentId: string } & TableState,
  ): Promise<{ result: StockAdjustmentLineWithDisplayDto[]; count: number }> {
    this.logger.log(`stockAdjustments.linesTable — adjustment: ${data.adjustmentId}`);
    const { adjustmentId, ...state } = data;
    return this.appService.findForTable(adjustmentId, state);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.linesByLotTable' })
  linesByLotTable(
    @Payload() data: { adjustmentId: string; lotId: string } & TableState,
  ): Promise<{ result: StockAdjustmentLineWithDisplayDto[]; count: number }> {
    this.logger.log(`stockAdjustments.linesByLotTable — adjustment: ${data.adjustmentId}, lot: ${data.lotId}`);
    const { adjustmentId, lotId, ...state } = data;
    return this.appService.findForTable(adjustmentId, state, lotId);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.lines' })
  lines(@Payload() data: { adjustmentId: string }): Promise<StockAdjustmentLineWithDisplayDto[]> {
    this.logger.log(`stockAdjustments.lines — adjustment: ${data.adjustmentId}`);
    return this.appService.findByAdjustmentId(data.adjustmentId);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.removeLine' })
  removeLine(@Payload() data: { adjustmentId: string; lineId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.removeLine — line: ${data.lineId}`);
    return this.appService.removeLine(data.adjustmentId, data.lineId);
  }
}
