import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/database';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type StockTransferStatus, StockTransferStatusValues, stockTransfers } from '@/db/schema';
import { StockTransferDto } from '../dto/entity/stock-transfer.dto';
import type { CreateStockTransferDto } from '../dto/request/create-stock-transfer.dto';
import type { UpdateStockTransferStatusDto } from '../dto/request/update-stock-transfer-status.dto';
import { StockTransfersDomainRepository } from '../repositories/stock-transfers.repository';

@Injectable()
export class StockTransfersDomainService {
  private readonly logger = new Logger(StockTransfersDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    status: { column: stockTransfers.status, type: 'string' },
  };

  constructor(private readonly repository: StockTransfersDomainRepository) {}

  // Returns paginated stock transfers for the data table
  async findForTable(state: TableViewState): Promise<{ result: StockTransferDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, StockTransfersDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, StockTransfersDomainService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, StockTransfersDomainService.FIELD_MAP);
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
      fromSiteId: data.fromSiteId,
      toSiteId: data.toSiteId,
      quantity: data.quantity,
      requestedBy: data.requestedBy ?? null,
      notes: data.notes ?? null,
    });

    this.logger.log(`Created stock transfer: ${entity.id} (from: ${data.fromSiteId}, to: ${data.toSiteId})`);
    return StockTransferDto.from(entity);
  }

  // Validates a status transition and returns the transfer entity. App-layer handles batch operations before calling applyStatus().
  async prepareStatusUpdate(
    id: string,
    data: Omit<UpdateStockTransferStatusDto, 'id'>,
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
  async applyStatus(
    id: string,
    data: Omit<UpdateStockTransferStatusDto, 'id'>,
  ): Promise<{ success: boolean; message: string }> {
    await this.repository.update(id, {
      status: data.status as StockTransferStatus,
      ...(data.receivedBy && { receivedBy: data.receivedBy }),
    });
    this.logger.log(`Updated stock transfer ${id} status: -> ${data.status}`);
    return { success: true, message: `Transfer status updated to ${data.status}.` };
  }
}
