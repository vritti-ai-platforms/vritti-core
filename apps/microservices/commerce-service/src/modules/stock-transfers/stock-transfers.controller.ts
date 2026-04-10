import type { StockTransferDto } from '@domain/stock-transfers/dto/entity/stock-transfer.dto';
import { StockTransfersService } from '@domain/stock-transfers/services/stock-transfers.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { FilterCondition, SearchState, SortCondition } from '@vritti/api-sdk';
import type { CreateStockTransferDto } from './dto/request/create-stock-transfer.dto';
import type { UpdateStockTransferStatusDto } from './dto/request/update-stock-transfer-status.dto';

@Controller()
export class StockTransfersController {
  private readonly logger = new Logger(StockTransfersController.name);

  constructor(private readonly service: StockTransfersService) {}

  @MessagePattern({ cmd: 'stockTransfers.table' })
  async table(@Payload() data: {
    filters: FilterCondition[];
    sort: SortCondition[];
    search: SearchState | null;
    pagination: { limit: number; offset: number };
  }): Promise<{ result: StockTransferDto[]; count: number }> {
    this.logger.log('stockTransfers.table');
    return this.service.findForTable({
      filters: data.filters ?? [],
      sort: data.sort ?? [],
      search: data.search ?? null,
      pagination: data.pagination ?? { limit: 20, offset: 0 },
    });
  }

  @MessagePattern({ cmd: 'stockTransfers.create' })
  async create(@Payload() dto: CreateStockTransferDto): Promise<StockTransferDto> {
    this.logger.log(`stockTransfers.create — from: ${dto.fromBuId}, to: ${dto.toBuId}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'stockTransfers.updateStatus' })
  async updateStatus(@Payload() data: { id: string } & UpdateStockTransferStatusDto): Promise<{ success: boolean; message: string }> {
    const { id, ...statusData } = data;
    this.logger.log(`stockTransfers.updateStatus — id: ${id}, status: ${statusData.status}`);
    return this.service.updateStatus(id, statusData);
  }
}
