import type { StockAdjustmentLineDto } from '@domain/stock-adjustment-lines/dto/entity/stock-adjustment-line.dto';
import type { StockAdjustmentDto } from '@domain/stock-adjustments/dto/entity/stock-adjustment.dto';
import { StockAdjustmentsService } from '@domain/stock-adjustments/services/stock-adjustments.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { type NatsHeaders, RpcNatsHeaders, type SuccessResponseDto, type TableViewState } from '@vritti/api-sdk';
import type { StockAdjustmentType } from '@/db/schema';

@Controller()
export class StockAdjustmentsController {
  private readonly logger = new Logger(StockAdjustmentsController.name);

  constructor(private readonly service: StockAdjustmentsService) {}

  @MessagePattern({ cmd: 'stockAdjustments.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: StockAdjustmentDto[]; count: number }> {
    this.logger.log('stockAdjustments.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'stockAdjustments.linesTable' })
  async linesTable(
    @Payload() data: { adjustmentId: string } & TableViewState,
  ): Promise<{ result: StockAdjustmentLineDto[]; count: number }> {
    this.logger.log(`stockAdjustments.linesTable — adjustment: ${data.adjustmentId}`);
    return this.service.findLinesForTable(data.adjustmentId, data);
  }

  @MessagePattern({ cmd: 'stockAdjustments.findById' })
  async findById(@Payload() data: { id: string }): Promise<StockAdjustmentDto> {
    this.logger.log(`stockAdjustments.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'stockAdjustments.create' })
  async create(
    @Payload() data: { inventoryItemId: string; type: StockAdjustmentType; reason?: string },
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<StockAdjustmentDto> {
    this.logger.log(`stockAdjustments.create — item: ${data.inventoryItemId}, type: ${data.type}`);
    return this.service.create({ ...data, createdById: headers.userId });
  }

  @MessagePattern({ cmd: 'stockAdjustments.addLine' })
  async addLine(
    @Payload() data: {
      adjustmentId: string;
      batchId?: string;
      locationId?: string;
      quantity: number;
      manufacturingDate?: string;
      expiryDate?: string;
    },
  ): Promise<StockAdjustmentLineDto> {
    this.logger.log(`stockAdjustments.addLine — adjustment: ${data.adjustmentId}`);
    return this.service.addLine(data.adjustmentId, {
      batchId: data.batchId,
      locationId: data.locationId,
      quantity: data.quantity,
      manufacturingDate: data.manufacturingDate,
      expiryDate: data.expiryDate,
    });
  }

  @MessagePattern({ cmd: 'stockAdjustments.updateLine' })
  async updateLine(
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
    return this.service.updateLine(data.adjustmentId, data.lineId, {
      quantity: data.quantity,
      locationId: data.locationId,
      manufacturingDate: data.manufacturingDate,
      expiryDate: data.expiryDate,
    });
  }

  @MessagePattern({ cmd: 'stockAdjustments.removeLine' })
  async removeLine(@Payload() data: { adjustmentId: string; lineId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.removeLine — line: ${data.lineId}`);
    return this.service.removeLine(data.adjustmentId, data.lineId);
  }

  @MessagePattern({ cmd: 'stockAdjustments.publish' })
  async publish(@Payload() data: { id: string }): Promise<StockAdjustmentDto> {
    this.logger.log(`stockAdjustments.publish — id: ${data.id}`);
    return this.service.publish(data.id);
  }

  @MessagePattern({ cmd: 'stockAdjustments.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
