import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateStockTransferDto } from '../dto/request/create-stock-transfer.dto';
import type { UpdateStockTransferStatusDto } from '../dto/request/update-stock-transfer-status.dto';
import type { StockTransferResponseDto } from '../dto/response/stock-transfer-response.dto';
import type { StockTransferTableResponseDto } from '../dto/response/stock-transfer-table-response.dto';

@Injectable()
export class StockTransfersGatewayService {
  private readonly logger = new Logger(StockTransfersGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered, and sorted stock transfers for the data table
  async findForTable(userId: string): Promise<StockTransferTableResponseDto> {
    this.logger.log('site.stockTransfers.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'commerce-stock-transfers',
    );

    const { result, count } = await this.nats.send<{ result: StockTransferResponseDto[]; count: number }>(
      'commerce',
      'site.stockTransfers.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new stock transfer
  async create(dto: CreateStockTransferDto): Promise<StockTransferResponseDto> {
    this.logger.log(`stockTransfers.create — from: ${dto.fromSiteId}, to: ${dto.toSiteId}`);
    return this.nats.send('commerce', 'site.stockTransfers.create', dto);
  }

  // Updates the status of a stock transfer
  async updateStatus(id: string, dto: UpdateStockTransferStatusDto): Promise<{ success: boolean; message: string }> {
    this.logger.log(`stockTransfers.updateStatus — id: ${id}, status: ${dto.status}`);
    return this.nats.send('commerce', 'site.stockTransfers.updateStatus', { id, ...dto });
  }
}
