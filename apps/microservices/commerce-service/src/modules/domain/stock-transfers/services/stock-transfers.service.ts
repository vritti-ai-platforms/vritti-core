import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { type StockTransferStatus, StockTransferStatusValues, stockTransfers } from '@/db/schema';
import type { CreateStockTransferDto } from '@/modules/stock-transfers/dto/request/create-stock-transfer.dto';
import type { UpdateStockTransferStatusDto } from '@/modules/stock-transfers/dto/request/update-stock-transfer-status.dto';
import { StockTransferDto } from '../dto/entity/stock-transfer.dto';
import { StockTransfersRepository } from '../repositories/stock-transfers.repository';

@Injectable()
export class StockTransfersService {
  private readonly logger = new Logger(StockTransfersService.name);

  private static readonly FIELD_MAP: FieldMap = {
    status: { column: stockTransfers.status, type: 'string' },
  };

  constructor(private readonly repository: StockTransfersRepository) {}

  // Returns paginated stock transfers for the data table
  async findForTable(state: TableViewState): Promise<{ result: StockTransferDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, StockTransfersService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, StockTransfersService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, StockTransfersService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllWithItemNames({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(stockTransfers.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map((r) => StockTransferDto.from(r, r.inventoryItemName)), count };
  }

  // Creates a new stock transfer request
  async create(data: CreateStockTransferDto): Promise<StockTransferDto> {
    const entity = await this.repository.create({
      inventoryItemId: data.inventoryItemId,
      fromBuId: data.fromBuId,
      toBuId: data.toBuId,
      quantity: data.quantity,
      requestedBy: data.requestedBy ?? null,
      notes: data.notes ?? null,
    });

    this.logger.log(`Created stock transfer: ${entity.id} (from: ${data.fromBuId}, to: ${data.toBuId})`);
    return StockTransferDto.from(entity);
  }

  // Validates a status transition and returns the transfer entity. App-layer handles batch operations before calling applyStatus().
  async prepareStatusUpdate(
    id: string,
    data: UpdateStockTransferStatusDto,
  ): Promise<{ transfer: StockTransferDto; currentStatus: string; newStatus: string }> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Stock transfer not found.');

    const newStatus = data.status;
    const currentStatus = entity.status;

    if (currentStatus === StockTransferStatusValues.RECEIVED) {
      throw new BadRequestException('Transfer is already received.');
    }
    if (currentStatus === StockTransferStatusValues.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled transfer.');
    }

    return { transfer: StockTransferDto.from(entity), currentStatus, newStatus };
  }

  // Persists the status change. Call after batch operations have been applied by the app-layer.
  async applyStatus(id: string, data: UpdateStockTransferStatusDto): Promise<{ success: boolean; message: string }> {
    await this.repository.update(id, {
      status: data.status as StockTransferStatus,
      ...(data.receivedBy && { receivedBy: data.receivedBy }),
    });
    this.logger.log(`Updated stock transfer ${id} status: -> ${data.status}`);
    return { success: true, message: `Transfer status updated to ${data.status}.` };
  }
}
