import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk';
import { and } from '@vritti/api-sdk/drizzle-orm';
import type {
  InventoryItemLedgerEntry,
  InventoryItemLedgerReferenceType,
  NewInventoryItemLedgerEntry,
} from '@/db/schema';
import { inventoryItemLedger, inventoryItems } from '@/db/schema';
import { InventoryItemLedgerDto } from '../dto/entity/inventory-item-ledger.dto';
import { InventoryItemLedgerRepository } from '../repositories/inventory-item-ledger.repository';

@Injectable()
export class InventoryItemLedgerService {
  private readonly logger = new Logger(InventoryItemLedgerService.name);

  private static readonly FIELD_MAP: FieldMap = {
    type: { column: inventoryItemLedger.type, type: 'string' },
    createdAt: { column: inventoryItemLedger.createdAt, type: 'string' },
    referenceType: { column: inventoryItemLedger.referenceType, type: 'string' },
    inventoryItemName: { column: inventoryItems.name, type: 'string' },
  };

  constructor(private readonly repository: InventoryItemLedgerRepository) {}

  // Creates a new ledger entry and returns the raw entity
  async createEntry(data: NewInventoryItemLedgerEntry): Promise<InventoryItemLedgerEntry> {
    const entry = await this.repository.createEntry(data);
    this.logger.log(`Created ledger entry ${entry.id} (${data.type}, qty: ${data.quantity})`);
    return entry;
  }

  // Returns paginated ledger entries for the data table
  async findForTable(state: TableViewState): Promise<{ result: InventoryItemLedgerDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryItemLedgerService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, InventoryItemLedgerService.FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, InventoryItemLedgerService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findAllForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      limit,
      offset,
    });

    return {
      result: result.map((r) => InventoryItemLedgerDto.from(r, r.inventoryItemName)),
      count,
    };
  }

  // Returns all ledger entries for a given inventory item
  async findByItemId(itemId: string): Promise<InventoryItemLedgerDto[]> {
    const entries = await this.repository.findByItemId(itemId);
    return entries.map((r) => InventoryItemLedgerDto.from(r));
  }

  // Returns all ledger entries for a given reference (e.g. a goods receipt or stock adjustment)
  async findByReference(
    referenceType: InventoryItemLedgerReferenceType,
    referenceId: string,
  ): Promise<InventoryItemLedgerDto[]> {
    const entries = await this.repository.findByReference(referenceType, referenceId);
    return entries.map((r) => InventoryItemLedgerDto.from(r));
  }
}
