import { Injectable, Logger } from '@nestjs/common';
import { type CreateResponseDto, DataTableStateService, NatsClientService, type SuccessResponseDto } from '@vritti/api-sdk';
import type { AddStockAdjustmentLineDto } from '../dto/request/add-stock-adjustment-line.dto';
import type { CreateStockAdjustmentDto } from '../dto/request/create-stock-adjustment.dto';
import type { UpdateStockAdjustmentLineDto } from '../dto/request/update-stock-adjustment-line.dto';
import type { StockAdjustmentResponseDto } from '../dto/response/stock-adjustment-response.dto';
import type { StockAdjustmentTableResponseDto } from '../dto/response/stock-adjustment-table-response.dto';

@Injectable()
export class StockAdjustmentsGatewayService {
  private readonly logger = new Logger(StockAdjustmentsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  async findForTable(userId: string): Promise<StockAdjustmentTableResponseDto> {
    this.logger.log('stockAdjustments.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'commerce-stock-adjustments',
    );

    const { result, count } = await this.nats.send<{ result: StockAdjustmentResponseDto[]; count: number }>(
      'commerce',
      'stockAdjustments.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  async findById(id: string): Promise<StockAdjustmentResponseDto> {
    this.logger.log(`stockAdjustments.findById — id: ${id}`);
    return this.nats.send('commerce', 'stockAdjustments.findById', { id });
  }

  async findLinesTable(adjustmentId: string, userId: string) {
    this.logger.log(`stockAdjustments.linesTable — adjustment: ${adjustmentId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, `stock-adjustment-${adjustmentId}-lines`);

    const { result, count } = await this.nats.send<{ result: unknown[]; count: number }>(
      'commerce',
      'stockAdjustments.linesTable',
      { adjustmentId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  async create(dto: CreateStockAdjustmentDto): Promise<CreateResponseDto<StockAdjustmentResponseDto>> {
    this.logger.log(`stockAdjustments.create — item: ${dto.inventoryItemId}, type: ${dto.type}`);
    return this.nats.send('commerce', 'stockAdjustments.create', dto);
  }

  async addLine(adjustmentId: string, dto: AddStockAdjustmentLineDto) {
    this.logger.log(`stockAdjustments.addLine — adjustment: ${adjustmentId}`);
    return this.nats.send('commerce', 'stockAdjustments.addLine', { adjustmentId, ...dto });
  }

  async updateLine(adjustmentId: string, lineId: string, dto: UpdateStockAdjustmentLineDto) {
    this.logger.log(`stockAdjustments.updateLine — line: ${lineId}`);
    return this.nats.send('commerce', 'stockAdjustments.updateLine', { adjustmentId, lineId, ...dto });
  }

  async removeLine(adjustmentId: string, lineId: string): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.removeLine — line: ${lineId}`);
    return this.nats.send('commerce', 'stockAdjustments.removeLine', { adjustmentId, lineId });
  }

  async publish(id: string): Promise<StockAdjustmentResponseDto> {
    this.logger.log(`stockAdjustments.publish — id: ${id}`);
    return this.nats.send('commerce', 'stockAdjustments.publish', { id });
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.delete — id: ${id}`);
    return this.nats.send('commerce', 'stockAdjustments.delete', { id });
  }
}
