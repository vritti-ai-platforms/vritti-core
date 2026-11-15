import { inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { decimal, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { siteStockOnHand } from './inventory-item-quants';
import { inventoryItems } from './inventory-items';
import { organizationIdColumn, siteDocumentColumns, siteDocumentPolicies } from './workspace-scope';

export const inventoryItemSiteStockLevels = commerceSchema.table(
  'inventory_item_site_stock_levels',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    ...siteDocumentColumns(),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    reorderPoint: decimal('reorder_point', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    maxStockLevel: decimal('max_stock_level', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    safetyStock: decimal('safety_stock', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_inventory_item_site_stock_levels').on(table.inventoryItemId, table.siteId),
    ...siteDocumentPolicies(),
  ],
);

export type InventoryItemSiteStockLevel = typeof inventoryItemSiteStockLevels.$inferSelect;
export type NewInventoryItemSiteStockLevel = typeof inventoryItemSiteStockLevels.$inferInsert;

// Where a site's on-hand quantity of an item sits against its stock levels there
export const StockStatusValues = {
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  BELOW_SAFETY_STOCK: 'BELOW_SAFETY_STOCK',
  REORDER: 'REORDER',
  HEALTHY: 'HEALTHY',
  OVER_MAX: 'OVER_MAX',
} as const;
export type StockStatus = (typeof StockStatusValues)[keyof typeof StockStatusValues];

// The site stock table's status filter options: whether an item has stock levels set at all, each stock status, and
// the band between the safety stock and the reorder point on its own
export const StockStatusFilterValues = {
  HAS_STOCK_LEVELS: 'HAS_STOCK_LEVELS',
  NO_STOCK_LEVELS: 'NO_STOCK_LEVELS',
  BETWEEN_SAFETY_STOCK_AND_REORDER: 'BETWEEN_SAFETY_STOCK_AND_REORDER',
  ...StockStatusValues,
} as const;
export type StockStatusFilter = (typeof StockStatusFilterValues)[keyof typeof StockStatusFilterValues];

// The stock status of an on-hand quantity against the stock levels row read alongside it; null when no row is joined
export function stockStatusSql(onHand: SQL): SQL<StockStatus | null> {
  const levels = inventoryItemSiteStockLevels;
  return sql<StockStatus | null>`case
    when ${levels.id} is null then null
    when ${onHand} <= 0 then ${StockStatusValues.OUT_OF_STOCK}
    when ${onHand} <= ${levels.safetyStock} then ${StockStatusValues.BELOW_SAFETY_STOCK}
    when ${onHand} <= ${levels.reorderPoint} then ${StockStatusValues.REORDER}
    when ${onHand} > ${levels.maxStockLevel} then ${StockStatusValues.OVER_MAX}
    else ${StockStatusValues.HEALTHY}
  end`;
}

// Where the joined stock on hand sits against the stock levels row read alongside it; null while none is joined
export const siteStockStatus = stockStatusSql(siteStockOnHand);

// The statuses each status filter option stands for: a shortfall takes in every worse one (Below Reorder covers Below
// Safety Stock and Out of Stock), the band between safety stock and reorder point stands alone, and the stock levels
// options match on whether any are set
const STOCK_STATUS_FILTER_MATCHES: Record<StockStatusFilter, string[]> = {
  [StockStatusFilterValues.HAS_STOCK_LEVELS]: Object.values(StockStatusValues),
  [StockStatusFilterValues.NO_STOCK_LEVELS]: [StockStatusFilterValues.NO_STOCK_LEVELS],
  [StockStatusFilterValues.OUT_OF_STOCK]: [StockStatusValues.OUT_OF_STOCK],
  [StockStatusFilterValues.BELOW_SAFETY_STOCK]: [StockStatusValues.OUT_OF_STOCK, StockStatusValues.BELOW_SAFETY_STOCK],
  [StockStatusFilterValues.BETWEEN_SAFETY_STOCK_AND_REORDER]: [StockStatusValues.REORDER],
  [StockStatusFilterValues.REORDER]: [
    StockStatusValues.OUT_OF_STOCK,
    StockStatusValues.BELOW_SAFETY_STOCK,
    StockStatusValues.REORDER,
  ],
  [StockStatusFilterValues.HEALTHY]: [StockStatusValues.HEALTHY],
  [StockStatusFilterValues.OVER_MAX]: [StockStatusValues.OVER_MAX],
};

// Whether the stock's status is one the picked status filter options stand for — the joined stock's, or the one given;
// an item with no stock levels set reads as NO_STOCK_LEVELS, and an option that no longer exists (a filter saved before
// the options changed) matches every row
export function siteStockStatusMatchesSql(options: string[], status: SQL = siteStockStatus): SQL {
  const statuses = options.flatMap((option) => STOCK_STATUS_FILTER_MATCHES[option as StockStatusFilter] ?? []);
  if (statuses.length === 0) return sql`true`;
  return inArray(sql`coalesce(${status}, ${StockStatusFilterValues.NO_STOCK_LEVELS})`, statuses);
}

// Whether a site with no stock levels set for the item is one the picked status filter options stand for; an option
// that no longer exists matches every site, as it does in siteStockStatusMatchesSql
export function noStockLevelsMatches(options: string[]): boolean {
  const statuses = options.flatMap((option) => STOCK_STATUS_FILTER_MATCHES[option as StockStatusFilter] ?? []);
  return statuses.length === 0 || statuses.includes(StockStatusFilterValues.NO_STOCK_LEVELS);
}
