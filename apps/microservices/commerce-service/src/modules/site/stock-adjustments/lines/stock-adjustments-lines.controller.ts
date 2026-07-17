import type { StockAdjustmentLineDto } from '@domain/stock-adjustment-lines/dto/entity/stock-adjustment-line.dto';
import { StockAdjustmentLinesService } from '@domain/stock-adjustment-lines/services/stock-adjustment-lines.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { AddChangeLineDto } from '../root/dto/request/add-change-line.dto';
import { AddOpeningLineDto } from '../root/dto/request/add-opening-line.dto';
import { UpdateChangeLineDto } from '../root/dto/request/update-change-line.dto';
import { UpdateOpeningLineDto } from '../root/dto/request/update-opening-line.dto';
import { StockAdjustmentsLinesService } from './services/stock-adjustments-lines.service';

@Controller()
export class StockAdjustmentsLinesController {
  private readonly logger = new Logger(StockAdjustmentsLinesController.name);

  constructor(
    private readonly service: StockAdjustmentLinesService,
    private readonly appService: StockAdjustmentsLinesService,
  ) {}

  @MessagePattern({ cmd: 'site.stockAdjustments.lines' })
  lines(@Payload() data: { adjustmentId: string }): Promise<StockAdjustmentLineDto[]> {
    this.logger.log(`stockAdjustments.lines — adjustment: ${data.adjustmentId}`);
    return this.service.findByAdjustmentId(data.adjustmentId);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.linesTable' })
  linesTable(
    @Payload() data: { adjustmentId: string } & TableViewState,
  ): Promise<{ result: StockAdjustmentLineDto[]; count: number }> {
    this.logger.log(`stockAdjustments.linesTable — adjustment: ${data.adjustmentId}`);
    const { adjustmentId, ...state } = data;
    return this.service.findForTable(adjustmentId, state);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.linesByLotTable' })
  linesByLotTable(
    @Payload() data: { adjustmentId: string; lotId: string } & TableViewState,
  ): Promise<{ result: StockAdjustmentLineDto[]; count: number }> {
    this.logger.log(`stockAdjustments.linesByLotTable — adjustment: ${data.adjustmentId}, lot: ${data.lotId}`);
    const { adjustmentId, lotId, ...state } = data;
    return this.service.findForTable(adjustmentId, state, lotId);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.lineById' })
  lineById(@Payload() data: { adjustmentId: string; lineId: string }): Promise<StockAdjustmentLineDto> {
    this.logger.log(`stockAdjustments.lineById — adjustment: ${data.adjustmentId}, line: ${data.lineId}`);
    return this.service.findById(data.adjustmentId, data.lineId);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.addOpeningLine' })
  addOpeningLine(@Payload() dto: AddOpeningLineDto): Promise<CreateResponseDto<StockAdjustmentLineDto>> {
    this.logger.log(`stockAdjustments.addOpeningLine — adjustment: ${dto.adjustmentId}`);
    const { adjustmentId, ...rest } = dto;
    return this.appService.addOpeningLine(adjustmentId, rest);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.addChangeLine' })
  addChangeLine(@Payload() dto: AddChangeLineDto): Promise<CreateResponseDto<StockAdjustmentLineDto>> {
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

  @MessagePattern({ cmd: 'site.stockAdjustments.removeLine' })
  removeLine(@Payload() data: { adjustmentId: string; lineId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.removeLine — line: ${data.lineId}`);
    return this.appService.removeLine(data.adjustmentId, data.lineId);
  }
}
