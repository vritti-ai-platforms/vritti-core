import type { StockAdjustmentDto } from '@domain/stock-adjustments/dto/entity/stock-adjustment.dto';
import { StockAdjustmentsService } from '@domain/stock-adjustments/services/stock-adjustments.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { FilterCondition, SearchState, SortCondition, SuccessResponseDto } from '@vritti/api-sdk';
import type { CreateStockAdjustmentDto } from './dto/request/create-stock-adjustment.dto';

@Controller()
export class StockAdjustmentsController {
  private readonly logger = new Logger(StockAdjustmentsController.name);

  constructor(private readonly service: StockAdjustmentsService) {}

  // Returns paginated stock adjustments for the data table
  @MessagePattern({ cmd: 'stockAdjustments.table' })
  async table(@Payload() data: {
    filters: FilterCondition[];
    sort: SortCondition[];
    search: SearchState | null;
    pagination: { limit: number; offset: number };
  }): Promise<{ result: StockAdjustmentDto[]; count: number }> {
    this.logger.log('stockAdjustments.table');
    return this.service.findForTable({
      filters: data.filters ?? [],
      sort: data.sort ?? [],
      search: data.search ?? null,
      pagination: data.pagination ?? { limit: 20, offset: 0 },
    });
  }

  // Creates a new stock adjustment
  @MessagePattern({ cmd: 'stockAdjustments.create' })
  async create(@Payload() dto: CreateStockAdjustmentDto): Promise<StockAdjustmentDto> {
    this.logger.log(`stockAdjustments.create — item: ${dto.inventoryItemId}, type: ${dto.type}`);
    return this.service.create(dto);
  }

  // Deletes an OPENING_STOCK or CORRECTION adjustment and its batch
  @MessagePattern({ cmd: 'stockAdjustments.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
