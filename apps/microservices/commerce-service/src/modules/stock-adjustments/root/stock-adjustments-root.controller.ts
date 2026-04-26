import type { StockAdjustmentDto } from '@domain/stock-adjustments/dto/entity/stock-adjustment.dto';
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
import type { StockAdjustmentType } from '@/db/schema';
import { StockAdjustmentsRootService } from './services/stock-adjustments-root.service';

@Controller()
export class StockAdjustmentsRootController {
  private readonly logger = new Logger(StockAdjustmentsRootController.name);

  constructor(private readonly service: StockAdjustmentsRootService) {}

  @MessagePattern({ cmd: 'stockAdjustments.table' })
  table(@Payload() state: TableViewState): Promise<{ result: StockAdjustmentDto[]; count: number }> {
    this.logger.log('stockAdjustments.table');
    return this.service.table(state);
  }

  @MessagePattern({ cmd: 'stockAdjustments.findById' })
  findById(@Payload() data: { id: string }): Promise<StockAdjustmentDto> {
    this.logger.log(`stockAdjustments.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'stockAdjustments.create' })
  create(
    @Payload() data: { inventoryItemId: string; type: StockAdjustmentType; reason: string },
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<StockAdjustmentDto>> {
    this.logger.log(`stockAdjustments.create — item: ${data.inventoryItemId}, type: ${data.type}`);
    if (!headers.userId) {
      throw new BadRequestException('User ID is required to create stock adjustments.');
    }
    return this.service.create({ ...data, createdById: headers.userId });
  }

  @MessagePattern({ cmd: 'stockAdjustments.publish' })
  publish(@Payload() data: { id: string }): Promise<StockAdjustmentDto> {
    this.logger.log(`stockAdjustments.publish — id: ${data.id}`);
    return this.service.publish(data.id);
  }

  @MessagePattern({ cmd: 'stockAdjustments.update' })
  update(@Payload() data: { id: string; reason?: string }): Promise<StockAdjustmentDto> {
    this.logger.log(`stockAdjustments.update — id: ${data.id}`);
    return this.service.update(data.id, { reason: data.reason });
  }

  @MessagePattern({ cmd: 'stockAdjustments.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
