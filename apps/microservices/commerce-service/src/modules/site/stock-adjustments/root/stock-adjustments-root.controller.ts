import type { StockAdjustmentDto } from '@domain/stock-adjustments/dto/entity/stock-adjustment.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { RpcSiteCurrencyCode } from '@vritti/api-sdk/nats';
import { CreateStockAdjustmentDto } from './dto/request/create-stock-adjustment.dto';
import { UpdateStockAdjustmentDto } from './dto/request/update-stock-adjustment.dto';
import { StockAdjustmentsRootService } from './services/stock-adjustments-root.service';

@Controller()
export class StockAdjustmentsRootController {
  private readonly logger = new Logger(StockAdjustmentsRootController.name);

  constructor(private readonly service: StockAdjustmentsRootService) {}

  @MessagePattern({ cmd: 'site.stockAdjustments.table' })
  table(
    @Payload() state: TableViewState,
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<{ result: StockAdjustmentDto[]; count: number }> {
    this.logger.log('stockAdjustments.table');
    return this.service.table(state, siteCurrencyCode);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.findById' })
  findById(
    @Payload() data: { id: string },
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<StockAdjustmentDto> {
    this.logger.log(`stockAdjustments.findById — id: ${data.id}`);
    return this.service.findById(data.id, siteCurrencyCode);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.create' })
  create(@Payload() dto: CreateStockAdjustmentDto): Promise<CreateResponseDto<StockAdjustmentDto>> {
    this.logger.log(`stockAdjustments.create — item: ${dto.inventoryItemId}, type: ${dto.type}`);
    return this.service.create({
      inventoryItemId: dto.inventoryItemId,
      type: dto.type,
      reason: dto.reason,
      unitCost: dto.unitCost !== undefined ? BigInt(dto.unitCost) : undefined,
    });
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.publish' })
  publish(
    @Payload() data: { id: string },
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<StockAdjustmentDto> {
    this.logger.log(`stockAdjustments.publish — id: ${data.id}, site currency: ${siteCurrencyCode}`);
    return this.service.publish(data.id, siteCurrencyCode);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.update' })
  update(
    @Payload() dto: UpdateStockAdjustmentDto,
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<StockAdjustmentDto> {
    this.logger.log(`stockAdjustments.update — id: ${dto.id}`);
    return this.service.update(
      dto.id,
      {
        reason: dto.reason ?? undefined,
        unitCost: dto.unitCost !== undefined ? BigInt(dto.unitCost) : undefined,
      },
      siteCurrencyCode,
    );
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
