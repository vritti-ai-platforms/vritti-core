import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService, NatsClientService } from '@vritti/api-sdk';
import type { CreateStockAdjustmentDto } from '../dto/request/create-stock-adjustment.dto';
import type { StockAdjustmentResponseDto } from '../dto/response/stock-adjustment-response.dto';
import type { StockAdjustmentTableResponseDto } from '../dto/response/stock-adjustment-table-response.dto';

@Injectable()
export class StockAdjustmentsGatewayService {
  private readonly logger = new Logger(StockAdjustmentsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered, and sorted stock adjustments for the data table
  async findForTable(userId: string): Promise<StockAdjustmentTableResponseDto> {
    this.logger.log('stockAdjustments.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-stock-adjustments');
    const { limit = 20, offset = 0 } = state.pagination ?? {};

    const { result, count } = await this.nats.send<{ result: StockAdjustmentResponseDto[]; count: number }>(
      'commerce',
      'stockAdjustments.table',
      {
        filters: state.filters,
        sort: state.sort,
        search: state.search ?? null,
        pagination: { limit, offset },
      },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new stock adjustment
  async create(dto: CreateStockAdjustmentDto): Promise<StockAdjustmentResponseDto> {
    this.logger.log(`stockAdjustments.create — item: ${dto.inventoryItemId}, type: ${dto.type}`);
    return this.nats.send('commerce', 'stockAdjustments.create', dto);
  }
}
