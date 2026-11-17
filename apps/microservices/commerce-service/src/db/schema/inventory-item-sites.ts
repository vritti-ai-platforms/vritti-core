import { eq, inArray, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, check, decimal, text, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { ReplenishmentMethodValues, replenishmentMethodEnum, SiteItemStatusValues, siteItemStatusEnum } from './enums';
import { siteStockOnHand } from './inventory-item-quants';
import { inventoryItems } from './inventory-items';
import { organizationIdColumn, siteDocumentColumns, siteDocumentPolicies } from './workspace-scope';

export const inventoryItemSites = commerceSchema.table(
  'inventory_item_sites',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    ...siteDocumentColumns(),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    status: siteItemStatusEnum('status').notNull().default(SiteItemStatusValues.ACTIVE),
    blockedReason: text('blocked_reason'),
    blockedAt: timestamp('blocked_at', { withTimezone: true }),
    replenishment: replenishmentMethodEnum('replenishment').notNull().default(ReplenishmentMethodValues.REORDER_POINT),
    safetyStock: decimal('safety_stock', { precision: 12, scale: 3, mode: 'number' }),
    reorderPoint: decimal('reorder_point', { precision: 12, scale: 3, mode: 'number' }),
    maxStock: decimal('max_stock', { precision: 12, scale: 3, mode: 'number' }),
    supplierItemsRequired: boolean('supplier_items_required').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_inventory_item_sites').on(table.inventoryItemId, table.siteId),
    check(
      'inventory_item_sites_replenishment_chk',
      sql`case ${table.replenishment}
        when ${ReplenishmentMethodValues.MANUAL} then ${table.safetyStock} is null and ${table.reorderPoint} is null and ${table.maxStock} is null
        else ${table.reorderPoint} > 0 and ${table.maxStock} >= ${table.reorderPoint}
          and (${table.safetyStock} is null or (${table.safetyStock} >= 0 and ${table.safetyStock} <= ${table.reorderPoint}))
      end`,
    ),
    check(
      'inventory_item_sites_blocked_chk',
      sql`${table.status} <> ${SiteItemStatusValues.BLOCKED} or ${table.blockedReason} is not null`,
    ),
    ...siteDocumentPolicies(),
  ],
);

export type InventoryItemSite = typeof inventoryItemSites.$inferSelect;
export type NewInventoryItemSite = typeof inventoryItemSites.$inferInsert;

// Where a site's on-hand quantity of an item sits: against its levels when it is replenished to a reorder point, only
// in or out of stock when it is bought by hand
export const StockStatusValues = {
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  BELOW_SAFETY_STOCK: 'BELOW_SAFETY_STOCK',
  REORDER: 'REORDER',
  HEALTHY: 'HEALTHY',
  OVER_MAX: 'OVER_MAX',
  IN_STOCK: 'IN_STOCK',
} as const;
export type StockStatus = (typeof StockStatusValues)[keyof typeof StockStatusValues];

// The site stock table's status filter options: whether the site carries the item at all, whether its purchasing is
// blocked, each stock status, and the band between the safety stock and the reorder point on its own
export const StockStatusFilterValues = {
  AT_SITE: 'AT_SITE',
  NOT_AT_SITE: 'NOT_AT_SITE',
  BLOCKED: 'BLOCKED',
  NO_STOCK_LEVELS: 'NO_STOCK_LEVELS',
  BETWEEN_SAFETY_STOCK_AND_REORDER: 'BETWEEN_SAFETY_STOCK_AND_REORDER',
  ...StockStatusValues,
} as const;
export type StockStatusFilter = (typeof StockStatusFilterValues)[keyof typeof StockStatusFilterValues];

// The stock status of an on-hand quantity against the site item read alongside it; null when the site does not carry
// the item
export function stockStatusSql(onHand: SQL): SQL<StockStatus | null> {
  const site = inventoryItemSites;
  return sql<StockStatus | null>`case
    when ${site.id} is null then null
    when ${onHand} <= 0 then ${StockStatusValues.OUT_OF_STOCK}
    when ${site.replenishment} = ${ReplenishmentMethodValues.MANUAL} then ${StockStatusValues.IN_STOCK}
    when ${onHand} <= coalesce(${site.safetyStock}, 0) then ${StockStatusValues.BELOW_SAFETY_STOCK}
    when ${onHand} <= ${site.reorderPoint} then ${StockStatusValues.REORDER}
    when ${onHand} > ${site.maxStock} then ${StockStatusValues.OVER_MAX}
    else ${StockStatusValues.HEALTHY}
  end`;
}

// Where the joined stock on hand sits against the site item read alongside it; null while none is joined
export const siteStockStatus = stockStatusSql(siteStockOnHand);

const STOCK_STATUS_FILTER_MATCHES: Record<Exclude<StockStatusFilter, SiteItemFilter>, string[]> = {
  [StockStatusFilterValues.AT_SITE]: Object.values(StockStatusValues),
  [StockStatusFilterValues.NOT_AT_SITE]: [StockStatusFilterValues.NOT_AT_SITE],
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
  [StockStatusFilterValues.IN_STOCK]: [StockStatusValues.IN_STOCK],
};

const SITE_ITEM_FILTER_MATCHES = {
  [StockStatusFilterValues.BLOCKED]: () => eq(inventoryItemSites.status, SiteItemStatusValues.BLOCKED),
  [StockStatusFilterValues.NO_STOCK_LEVELS]: () =>
    eq(inventoryItemSites.replenishment, ReplenishmentMethodValues.MANUAL),
};
type SiteItemFilter = keyof typeof SITE_ITEM_FILTER_MATCHES;

// The stock statuses the picked filter options stand for; an option that no longer exists stands for none
function matchedStatuses(options: string[]): string[] {
  return options.flatMap(
    (option) => STOCK_STATUS_FILTER_MATCHES[option as Exclude<StockStatusFilter, SiteItemFilter>] ?? [],
  );
}

// The site item conditions the picked filter options stand for
function matchedSiteItemConditions(options: string[]): SQL[] {
  return options.flatMap((option) =>
    option in SITE_ITEM_FILTER_MATCHES ? [SITE_ITEM_FILTER_MATCHES[option as SiteItemFilter]()] : [],
  );
}

// Whether the stock is one the picked status filter options stand for — the joined stock's status, or the one given,
// and the joined site item itself for Blocked and No stock levels; an item the site does not carry reads as NOT_AT_SITE,
// and options that no longer exist (a filter saved before the options changed) match every row
export function siteStockStatusMatchesSql(options: string[], status: SQL = siteStockStatus): SQL {
  const statuses = matchedStatuses(options);
  const matches = [
    ...(statuses.length > 0
      ? [inArray(sql`coalesce(${status}, ${StockStatusFilterValues.NOT_AT_SITE})`, statuses)]
      : []),
    ...matchedSiteItemConditions(options),
  ];
  if (matches.length === 0) return sql`true`;
  return or(...matches) as SQL;
}

// Whether a site that does not carry the item is one the picked status filter options stand for; options that no
// longer exist match every site, as they do in siteStockStatusMatchesSql
export function notAtSiteMatches(options: string[]): boolean {
  const statuses = matchedStatuses(options);
  if (statuses.length === 0 && !options.some((option) => option in SITE_ITEM_FILTER_MATCHES)) return true;
  return statuses.includes(StockStatusFilterValues.NOT_AT_SITE);
}
