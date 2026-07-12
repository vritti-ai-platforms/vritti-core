import type { StockTransferDto } from '@domain/stock-transfers/dto/entity/stock-transfer.dto';
import { StockTransfersService } from '@domain/stock-transfers/services/stock-transfers.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/database';
import type { CreateStockTransferDto } from './dto/request/create-stock-transfer.dto';
import type { UpdateStockTransferStatusDto } from './dto/request/update-stock-transfer-status.dto';
import { StockTransfersRootService } from './services/stock-transfers-root.service';

@Controller()
export class StockTransfersController {
  private readonly logger = new Logger(StockTransfersController.name);

  constructor(
    private readonly service: StockTransfersService,
    private readonly rootService: StockTransfersRootService,
  ) {}

  @MessagePattern({ cmd: 'site.stockTransfers.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: StockTransferDto[]; count: number }> {
    this.logger.log('stockTransfers.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'site.stockTransfers.create' })
  async create(@Payload() dto: CreateStockTransferDto): Promise<StockTransferDto> {
    this.logger.log(`stockTransfers.create — from: ${dto.fromSiteId}, to: ${dto.toSiteId}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'site.stockTransfers.updateStatus' })
  async updateStatus(
    @Payload() data: { id: string } & UpdateStockTransferStatusDto,
  ): Promise<{ success: boolean; message: string }> {
    const { id, ...statusData } = data;
    this.logger.log(`stockTransfers.updateStatus — id: ${id}, status: ${statusData.status}`);
    return this.rootService.updateStatus(id, statusData);
  }
}
