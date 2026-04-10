import { Injectable, Logger } from '@nestjs/common';
import {
  type FieldMap,
  type FilterCondition,
  FilterProcessor,
  NotFoundException,
  BadRequestException,
  type SearchState,
  type SortCondition,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { stockTransfers, StockTransferStatusValues, InventoryLedgerTypeValues } from '@/db/schema';
import { StockTransferDto } from '../dto/entity/stock-transfer.dto';
import type { CreateStockTransferDto } from '@/modules/stock-transfers/dto/request/create-stock-transfer.dto';
import type { UpdateStockTransferStatusDto } from '@/modules/stock-transfers/dto/request/update-stock-transfer-status.dto';
import { StockTransfersRepository } from '../repositories/stock-transfers.repository';

@Injectable()
export class StockTransfersService {
  private readonly logger = new Logger(StockTransfersService.name);

  private static readonly FIELD_MAP: FieldMap = {
    status: { column: stockTransfers.status, type: 'string' },
  };

  constructor(private readonly repository: StockTransfersRepository) {}

  // Returns paginated stock transfers for the data table
  async findForTable(params: {
    filters: FilterCondition[];
    sort: SortCondition[];
    search: SearchState | null;
    pagination: { limit: number; offset: number };
  }): Promise<{ result: StockTransferDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(params.filters, StockTransfersService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(params.search, StockTransfersService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(params.sort, StockTransfersService.FIELD_MAP);

    const { result: rows, count } = await this.repository.findAllWithItemNames({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(stockTransfers.createdAt)],
      limit: params.pagination.limit,
      offset: params.pagination.offset,
    });

    return { result: rows.map((r) => StockTransferDto.from(r, r.inventoryItemName)), count };
  }

  // Creates a new stock transfer request
  async create(data: CreateStockTransferDto): Promise<StockTransferDto> {
    const entity = await this.repository.create({
      inventoryItemId: data.inventoryItemId,
      fromBuId: data.fromBuId,
      toBuId: data.toBuId,
      quantity: String(data.quantity),
      requestedBy: data.requestedBy ?? null,
      notes: data.notes ?? null,
    });

    this.logger.log(`Created stock transfer: ${entity.id} (from: ${data.fromBuId}, to: ${data.toBuId})`);
    return StockTransferDto.from(entity);
  }

  // Updates transfer status, handles inventory changes on IN_TRANSIT and RECEIVED
  async updateStatus(id: string, data: UpdateStockTransferStatusDto): Promise<{ success: boolean; message: string }> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Stock transfer not found.');

    const newStatus = data.status;
    const currentStatus = entity.status;

    // Validate status transitions
    if (currentStatus === StockTransferStatusValues.RECEIVED) {
      throw new BadRequestException('Transfer is already received.');
    }
    if (currentStatus === StockTransferStatusValues.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled transfer.');
    }

    // On IN_TRANSIT: deduct from source BU
    if (newStatus === StockTransferStatusValues.IN_TRANSIT && currentStatus === StockTransferStatusValues.REQUESTED) {
      const qty = Number(entity.quantity);
      await this.repository.deductFromInventoryLevelForBu(entity.inventoryItemId, entity.fromBuId, qty);
      await this.repository.createLedgerEntry({
        inventoryItemId: entity.inventoryItemId,
        businessUnitId: entity.fromBuId,
        type: InventoryLedgerTypeValues.TRANSFER_OUT,
        quantity: String(-qty),
        balanceAfter: '0',
        referenceType: 'stock_transfer',
        referenceId: id,
        notes: `Transfer out to BU ${entity.toBuId}`,
      });
    }

    // On RECEIVED: add to destination BU
    if (newStatus === StockTransferStatusValues.RECEIVED) {
      const qty = Number(entity.quantity);
      await this.repository.addToInventoryLevelForBu(entity.inventoryItemId, entity.toBuId, qty);
      await this.repository.createLedgerEntry({
        inventoryItemId: entity.inventoryItemId,
        businessUnitId: entity.toBuId,
        type: InventoryLedgerTypeValues.TRANSFER_IN,
        quantity: String(qty),
        balanceAfter: '0',
        referenceType: 'stock_transfer',
        referenceId: id,
        notes: `Transfer in from BU ${entity.fromBuId}`,
      });
    }

    const updatePayload: Record<string, unknown> = { status: newStatus };
    if (data.receivedBy) updatePayload.receivedBy = data.receivedBy;

    await this.repository.update(id, updatePayload);
    this.logger.log(`Updated stock transfer ${id} status: ${currentStatus} -> ${newStatus}`);
    return { success: true, message: `Transfer status updated to ${newStatus}.` };
  }
}
