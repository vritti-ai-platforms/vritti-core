import type { StockAdjustmentDto } from '@domain/stock-adjustments/dto/entity/stock-adjustment.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { RpcSiteCurrencyCode } from '@vritti/api-sdk/nats';
import type { StockAdjustmentType } from '@/db/schema';
import { StockAdjustmentsRootService } from './services/stock-adjustments-root.service';

@Controller()
export class StockAdjustmentsRootController {
  private readonly logger = new Logger(StockAdjustmentsRootController.name);

  constructor(private readonly service: StockAdjustmentsRootService) {}

  @MessagePattern({ cmd: 'stockAdjustments.table' })
  table(
    @Payload() state: TableViewState,
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<{ result: StockAdjustmentDto[]; count: number }> {
    this.logger.log('stockAdjustments.table');
    return this.service.table(state, siteCurrencyCode);
  }

  @MessagePattern({ cmd: 'stockAdjustments.findById' })
  findById(
    @Payload() data: { id: string },
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<StockAdjustmentDto> {
    this.logger.log(`stockAdjustments.findById — id: ${data.id}`);
    return this.service.findById(data.id, siteCurrencyCode);
  }

  @MessagePattern({ cmd: 'stockAdjustments.create' })
  create(
    @Payload()
    data: { inventoryItemId: string; type: StockAdjustmentType; reason: string; unitCost?: string },
  ): Promise<CreateResponseDto<StockAdjustmentDto>> {
    this.logger.log(`stockAdjustments.create — item: ${data.inventoryItemId}, type: ${data.type}`);
    return this.service.create({
      inventoryItemId: data.inventoryItemId,
      type: data.type,
      reason: data.reason,
      unitCost: data.unitCost !== undefined ? BigInt(data.unitCost) : undefined,
    });
  }

  @MessagePattern({ cmd: 'stockAdjustments.publish' })
  publish(
    @Payload() data: { id: string },
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<StockAdjustmentDto> {
    this.logger.log(`stockAdjustments.publish — id: ${data.id}, site currency: ${siteCurrencyCode}`);
    return this.service.publish(data.id, siteCurrencyCode);
  }

  @MessagePattern({ cmd: 'stockAdjustments.update' })
  update(
    @Payload() data: { id: string; reason?: string; unitCost?: string },
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<StockAdjustmentDto> {
    this.logger.log(`stockAdjustments.update — id: ${data.id}`);
    return this.service.update(
      data.id,
      {
        reason: data.reason,
        unitCost: data.unitCost !== undefined ? BigInt(data.unitCost) : undefined,
      },
      siteCurrencyCode,
    );
  }

  @MessagePattern({ cmd: 'stockAdjustments.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
