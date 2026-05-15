import { InventoryItemQuantsService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import {
  InventoryItemLedgerReferenceTypeValues,
  InventoryItemLedgerTypeValues,
  StockTransferStatusValues,
  stockTransfers,
} from '@/db/schema';
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

  constructor(
    private readonly repository: StockTransfersRepository,
    private readonly batchesService: InventoryItemQuantsService,
  ) {}

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
      quantity: String(data.quantity),
      requestedBy: data.requestedBy ?? null,
      notes: data.notes ?? null,
    });

    this.logger.log(`Created stock transfer: ${entity.id} (from: ${data.fromBuId}, to: ${data.toBuId})`);
    return StockTransferDto.from(entity);
  }

  // Updates transfer status; handles inventory batch changes on IN_TRANSIT and RECEIVED
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

    // On IN_TRANSIT: deduct from source batch
    if (newStatus === StockTransferStatusValues.IN_TRANSIT && currentStatus === StockTransferStatusValues.REQUESTED) {
      if (data.fromBatchId) {
        await this.batchesService.adjustBatch({
          batchId: data.fromBatchId,
          quantity: -Number(entity.quantity),
          type: InventoryItemLedgerTypeValues.TRANSFER_OUT,
          referenceType: InventoryItemLedgerReferenceTypeValues.STOCK_TRANSFER,
          referenceId: id,
          notes: `Transfer out to location ${data.toLocationId}`,
        });
      }
    }

    // On RECEIVED: create new batch in destination location, preserving source lot identity
    if (newStatus === StockTransferStatusValues.RECEIVED) {
      const sourceLot = data.fromBatchId ? await this.batchesService.loadLotByQuantId(data.fromBatchId) : null;
      const lot = sourceLot
        ? {
            lotNumber: sourceLot.lotNumber,
            manufacturingDate: sourceLot.manufacturingDate ?? null,
            expiryDate: sourceLot.expiryDate ?? null,
          }
        : undefined;

      await this.batchesService.createBatch({
        inventoryItemId: entity.inventoryItemId,
        locationId: data.toLocationId,
        quantity: Number(entity.quantity),
        lot,
        type: InventoryItemLedgerTypeValues.TRANSFER_IN,
        referenceType: InventoryItemLedgerReferenceTypeValues.STOCK_TRANSFER,
        referenceId: id,
        notes: `Transfer in from location ${data.fromLocationId}`,
      });
    }

    const updatePayload: Record<string, unknown> = { status: newStatus };
    if (data.receivedBy) updatePayload.receivedBy = data.receivedBy;

    await this.repository.update(id, updatePayload);
    this.logger.log(`Updated stock transfer ${id} status: ${currentStatus} -> ${newStatus}`);
    return { success: true, message: `Transfer status updated to ${newStatus}.` };
  }
}
