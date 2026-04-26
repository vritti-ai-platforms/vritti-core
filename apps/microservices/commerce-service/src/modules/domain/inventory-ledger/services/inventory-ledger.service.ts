import { Injectable, Logger } from '@nestjs/common';
import {
  type FieldMap,
  FilterProcessor,
  type TableViewState,
  type TypedDrizzleClient,
} from '@vritti/api-sdk';
import { and } from '@vritti/api-sdk/drizzle-orm';
import type { InventoryLedgerEntry, InventoryLedgerReferenceType, NewInventoryLedgerEntry } from '@/db/schema';
import { inventoryItemLots, inventoryItems, inventoryLedger } from '@/db/schema';
import { InventoryLedgerDto } from '../dto/entity/inventory-ledger.dto';
import { InventoryLedgerRepository } from '../repositories/inventory-ledger.repository';

@Injectable()
export class InventoryLedgerService {
  private readonly logger = new Logger(InventoryLedgerService.name);

  private static readonly FIELD_MAP: FieldMap = {
    type: { column: inventoryLedger.type, type: 'string' },
    createdAt: { column: inventoryLedger.createdAt, type: 'string' },
    referenceType: { column: inventoryLedger.referenceType, type: 'string' },
    inventoryItemName: { column: inventoryItems.name, type: 'string' },
    lotNumber: { column: inventoryItemLots.lotNumber, type: 'string' },
  };

  constructor(private readonly repository: InventoryLedgerRepository) {}

  async createEntry(data: NewInventoryLedgerEntry): Promise<InventoryLedgerEntry> {
    const entry = await this.repository.createEntry(data);
    this.logger.log(`Created ledger entry ${entry.id} (${data.type}, qty: ${data.quantity})`);
    return entry;
  }

  async createEntryInTx(tx: TypedDrizzleClient, data: NewInventoryLedgerEntry): Promise<InventoryLedgerEntry> {
    return this.repository.createEntryWithTx(tx, data);
  }

  async findForTable(state: TableViewState): Promise<{ result: InventoryLedgerDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryLedgerService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, InventoryLedgerService.FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, InventoryLedgerService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findAllForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      limit,
      offset,
    });

    return {
      result: result.map((r) => InventoryLedgerDto.from(r, r.inventoryItemName, r.lotNumber)),
      count,
    };
  }

  async findByBatch(
    batchId: string,
    state: TableViewState,
  ): Promise<{ result: InventoryLedgerDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryLedgerService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, InventoryLedgerService.FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, InventoryLedgerService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findByBatchId(batchId, {
      where,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      limit,
      offset,
    });

    return { result: result.map((r) => InventoryLedgerDto.from(r)), count };
  }

  async findByReference(referenceType: InventoryLedgerReferenceType, referenceId: string): Promise<InventoryLedgerDto[]> {
    const entries = await this.repository.findByReference(referenceType, referenceId);
    return entries.map((r) => InventoryLedgerDto.from(r));
  }

  async hasNonOpeningEntries(batchId: string): Promise<boolean> {
    return this.repository.hasNonOpeningEntries(batchId);
  }
}
