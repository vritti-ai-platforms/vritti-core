import { Injectable, Logger } from '@nestjs/common';
import {
  CursorCodec,
  type FieldMap,
  FilterProcessor,
  type KeysetOrderBy,
  KeysetProcessor,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import type { InventoryItemLedgerEntry, NewInventoryItemLedgerEntry } from '@/db/schema';
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

  // Keyset ledger feed for one item (mobile Relay, read-only). Ordered by (createdAt desc, id asc); the
  // cursor encodes those boundary values (via CursorCodec) so pages don't skip/duplicate.
  async findFeed(
    inventoryItemId: string,
    limit: number,
    cursor?: string,
  ): Promise<{
    edges: { cursor: string; node: InventoryItemLedgerDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    const orderByEntries: (KeysetOrderBy & { key: string })[] = [
      { column: inventoryItemLedger.createdAt, direction: 'desc', key: 'createdAt' },
      { column: inventoryItemLedger.id, direction: 'asc', key: 'id' },
    ];
    const orderBy = orderByEntries.map((e) => (e.direction === 'asc' ? asc(e.column) : desc(e.column)));
    const cursorWhere = cursor ? KeysetProcessor.buildAfter(orderByEntries, CursorCodec.decode(cursor)) : undefined;
    const where = and(eq(inventoryItemLedger.inventoryItemId, inventoryItemId), cursorWhere);

    const { rows, hasMore } = await this.repository.findLedgerFeedKeyset({ where, orderBy, limit });
    const edges = rows.map((r) => ({
      cursor: CursorCodec.encode(orderByEntries.map((e) => (r as Record<string, unknown>)[e.key])),
      node: InventoryItemLedgerDto.from(r, r.inventoryItemName),
    }));
    return {
      edges,
      pageInfo: { hasNextPage: hasMore, endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null },
    };
  }

  // Returns paginated ledger entries for one item's data table (web). Scoped to inventoryItemId — the
  // inventory_item_ledger table has no RLS, so without this filter the per-item tab leaks every item's rows.
  async findForTable(
    inventoryItemId: string,
    state: TableViewState,
  ): Promise<{ result: InventoryItemLedgerDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryItemLedgerService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, InventoryItemLedgerService.FIELD_MAP);
    const where = and(eq(inventoryItemLedger.inventoryItemId, inventoryItemId), filterWhere, searchWhere);
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
}
