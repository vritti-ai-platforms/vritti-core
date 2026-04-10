import type { StockAdjustmentDto } from '@domain/stock-adjustments/dto/entity/stock-adjustment.dto';
import { StockAdjustmentsService } from '@domain/stock-adjustments/services/stock-adjustments.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { FilterCondition, SearchState, SortCondition } from '@vritti/api-sdk';
import type { CreateStockAdjustmentDto } from './dto/request/create-stock-adjustment.dto';

@Controller()
export class StockAdjustmentsController {
  private readonly logger = new Logger(StockAdjustmentsController.name);

  constructor(private readonly service: StockAdjustmentsService) {}

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

  @MessagePattern({ cmd: 'stockAdjustments.create' })
  async create(@Payload() dto: CreateStockAdjustmentDto): Promise<StockAdjustmentDto> {
    this.logger.log(`stockAdjustments.create — item: ${dto.inventoryItemId}, type: ${dto.type}`);
    return this.service.create(dto);
  }
}
