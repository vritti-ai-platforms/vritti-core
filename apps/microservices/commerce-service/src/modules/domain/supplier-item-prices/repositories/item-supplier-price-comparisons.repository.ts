import { Injectable } from '@nestjs/common';
import type { FieldMap, FilterOperator } from '@vritti/api-sdk/conditions';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, exists, gte, isNull, lt, lte, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { alias } from '@vritti/api-sdk/drizzle-pg-core';
import {
  inventoryItemMrps,
  inventoryItems,
  inventoryItemUomConversions,
  parties,
  supplierItemPrices,
  supplierItems,
  supplierSiteItems,
  suppliers,
  uom,
} from '@/db/schema';

export interface ItemSupplierPriceComparisonRow {
  supplierItemId: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  quotedUomSymbol: string | null;
  isPreferred: boolean;
  currencyCode: string | null;
  currentPrice: bigint | null;
  currentFrom: string | null;
  currentTo: string | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  effectivePrice: bigint | null;
  pricePerPrimary: bigint | null;
  effectivePricePerPrimary: bigint | null;
  mrpAmount: bigint | null;
  previousCurrencyCode: string | null;
  previousPrice: bigint | null;
  changePercent: number | null;
  priceCount: number;
}

export type ItemSupplierPriceStanding = ReturnType<ItemSupplierPriceComparisonsRepository['standingOn']>;

const quotedUom = alias(uom, 'quoted_uom');
const primaryUom = alias(uom, 'primary_uom');
const earlierPrices = alias(supplierItemPrices, 'earlier_prices');

// How many of the item's primary units one quoted unit holds: 1 for the primary unit itself, else the item's own
// conversion, else the two units' shared base; null when the units cannot convert
const primaryUnitsPerQuotedUnit = sql`case
  when ${supplierItems.uomId} = ${inventoryItems.uomId} then 1::numeric
  when ${inventoryItemUomConversions.id} is not null
    then ${inventoryItemUomConversions.primaryUomQty}::numeric / ${inventoryItemUomConversions.uomQty}
  when coalesce(${quotedUom.baseUnitId}, ${quotedUom.id}) = coalesce(${primaryUom.baseUnitId}, ${primaryUom.id})
    then (${quotedUom.baseUomQty}::numeric * ${primaryUom.uomQty}) / (${quotedUom.uomQty} * ${primaryUom.baseUomQty})
end`;

// What one paid unit costs once a buy + free scheme is counted in: buy ÷ (buy + free); 1 with no scheme
const schemeShare = sql`case
  when ${supplierItemPrices.schemeBuyQty} is not null and ${supplierItemPrices.schemeFreeQty} is not null
    then ${supplierItemPrices.schemeBuyQty}::numeric / (${supplierItemPrices.schemeBuyQty} + ${supplierItemPrices.schemeFreeQty})
  else 1::numeric
end`;

// A numeric amount rounded half up to whole minor units
function minorUnits(amount: SQL, name: string) {
  return sql<bigint>`round(${amount})`.mapWith((value) => BigInt(value)).as(name);
}

@Injectable()
export class ItemSupplierPriceComparisonsRepository extends PrimaryBaseRepository<typeof supplierSiteItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierSiteItems);
  }

  // A supplier item's standing at its site on the day: the price in force and the one it replaced, as lateral subqueries
  standingOn(asOf: string) {
    const current = this.currentPriceOn(asOf);
    return { current, previous: this.previousPriceBefore(current) };
  }

  // The comparison table's fields: the site in its context, the user's filters, search and sorts — money sorts within a
  // currency before across currencies, and rows with no price in force sort last either way
  fieldMap({ current, previous }: ItemSupplierPriceStanding): FieldMap {
    // A yes / no filter on whether a condition holds, honouring a negated operator
    const flag = (holds: SQL, value: string | number, operator: FilterOperator) =>
      (String(value) === 'true') !== (operator === 'notEquals') ? holds : sql`not (${holds})`;
    return {
      site: { column: supplierSiteItems.siteId, type: 'string' },
      isPreferred: { column: supplierSiteItems.isPreferred, type: 'boolean' },
      inForce: {
        expression: (value, operator) => flag(sql`${current.id} is not null`, value, operator),
        type: 'boolean',
      },
      hasScheme: {
        expression: (value, operator) => flag(sql`${current.schemeBuyQty} is not null`, value, operator),
        type: 'boolean',
      },
      currency: { column: current.currencyCode, type: 'string' },
      supplierName: { column: parties.displayName, type: 'string' },
      supplierCode: { column: suppliers.code, type: 'string' },
      quotedUomSymbol: { column: quotedUom.symbol, type: 'string' },
      currentPrice: { column: current.moneyOrder, type: 'number', nulls: 'last' },
      effectivePricePerPrimary: { column: current.effectiveOrder, type: 'number', nulls: 'last' },
      changePercent: { column: previous.changePercent, type: 'number', nulls: 'last' },
    };
  }

  // Builds the lateral subquery of each supplier item's price in force at its site on the day — its own, else its legal
  // entity's — with every per-unit and after-scheme figure that filters and sorts read
  currentPriceOn(asOf: string) {
    return this.db
      .select({
        id: supplierItemPrices.id,
        siteId: supplierItemPrices.siteId,
        currencyCode: supplierItemPrices.currencyCode,
        unitPrice: supplierItemPrices.unitPrice,
        validFrom: supplierItemPrices.validFrom,
        validTo: supplierItemPrices.validTo,
        schemeBuyQty: supplierItemPrices.schemeBuyQty,
        schemeFreeQty: supplierItemPrices.schemeFreeQty,
        mrpId: supplierItemPrices.mrpId,
        effectivePrice: minorUnits(sql`${supplierItemPrices.unitPrice} * ${schemeShare}`, 'effective_price'),
        pricePerPrimary: minorUnits(
          sql`${supplierItemPrices.unitPrice} / ${primaryUnitsPerQuotedUnit}`,
          'price_per_primary',
        ),
        effectivePricePerPrimary: minorUnits(
          sql`${supplierItemPrices.unitPrice} * ${schemeShare} / ${primaryUnitsPerQuotedUnit}`,
          'effective_price_per_primary',
        ),
        moneyOrder: sql`row(${supplierItemPrices.currencyCode}, ${supplierItemPrices.unitPrice})`.as('money_order'),
        effectiveOrder: sql`row(
          ${supplierItemPrices.currencyCode},
          ${supplierItemPrices.unitPrice} * ${schemeShare} / ${primaryUnitsPerQuotedUnit}
        )`.as('effective_order'),
      })
      .from(supplierItemPrices)
      .where(
        and(
          eq(supplierItemPrices.supplierItemId, supplierSiteItems.supplierItemId),
          or(eq(supplierItemPrices.siteId, supplierSiteItems.siteId), isNull(supplierItemPrices.siteId)),
          lte(supplierItemPrices.validFrom, asOf),
          or(isNull(supplierItemPrices.validTo), gte(supplierItemPrices.validTo, asOf)),
        ),
      )
      .orderBy(sql`${supplierItemPrices.siteId} is null`, desc(supplierItemPrices.validFrom))
      .limit(1)
      .as('current_price');
  }

  // The price the one in force replaced in its own stratum (the site's, or the legal entity's), and the move between them in percent when both are in one currency
  previousPriceBefore(current: ReturnType<ItemSupplierPriceComparisonsRepository['currentPriceOn']>) {
    return this.db
      .select({
        currencyCode: earlierPrices.currencyCode,
        unitPrice: earlierPrices.unitPrice,
        changePercent: sql<number>`case
          when ${earlierPrices.currencyCode} = ${current.currencyCode} and ${earlierPrices.unitPrice} > 0
            then round((${current.unitPrice} - ${earlierPrices.unitPrice}) * 100.0 / ${earlierPrices.unitPrice}, 1)
        end`
          .mapWith(Number)
          .as('change_percent'),
      })
      .from(earlierPrices)
      .where(
        and(
          eq(earlierPrices.supplierItemId, supplierSiteItems.supplierItemId),
          sql`${earlierPrices.siteId} is not distinct from ${current.siteId}`,
          lt(earlierPrices.validFrom, current.validFrom),
        ),
      )
      .orderBy(desc(earlierPrices.validFrom))
      .limit(1)
      .as('previous_price');
  }

  // Every supplier item of an inventory item that has prices at a site or for its legal entity, one row each with its standing on the day;
  // the where (the site in the table's context, the user's filters and search) is built by the caller
  findForTable(options: {
    inventoryItemId: string;
    standing: ItemSupplierPriceStanding;
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: ItemSupplierPriceComparisonRow[]; count: number }> {
    const { current, previous } = options.standing;
    return this.findAllAndCount<ItemSupplierPriceComparisonRow>({
      select: {
        supplierItemId: supplierSiteItems.supplierItemId,
        supplierId: supplierItems.supplierId,
        supplierName: parties.displayName,
        supplierCode: suppliers.code,
        quotedUomSymbol: quotedUom.symbol,
        isPreferred: supplierSiteItems.isPreferred,
        currencyCode: current.currencyCode,
        currentPrice: current.unitPrice,
        currentFrom: current.validFrom,
        currentTo: current.validTo,
        schemeBuyQty: current.schemeBuyQty,
        schemeFreeQty: current.schemeFreeQty,
        effectivePrice: current.effectivePrice,
        pricePerPrimary: current.pricePerPrimary,
        effectivePricePerPrimary: current.effectivePricePerPrimary,
        mrpAmount: inventoryItemMrps.amount,
        previousCurrencyCode: previous.currencyCode,
        previousPrice: previous.unitPrice,
        changePercent: previous.changePercent,
        priceCount: sql<number>`(
          select count(*)::int from ${supplierItemPrices}
          where ${supplierItemPrices.supplierItemId} = ${supplierSiteItems.supplierItemId}
            and (${supplierItemPrices.siteId} = ${supplierSiteItems.siteId} or ${supplierItemPrices.siteId} is null)
        )`.mapWith(Number),
      },
      innerJoins: [
        { table: supplierItems, on: eq(supplierItems.id, supplierSiteItems.supplierItemId) },
        { table: suppliers, on: eq(suppliers.id, supplierItems.supplierId) },
        { table: parties, on: eq(parties.id, suppliers.partyId) },
        { table: inventoryItems, on: eq(inventoryItems.id, supplierSiteItems.inventoryItemId) },
      ],
      leftJoins: [
        { table: quotedUom, on: eq(quotedUom.id, supplierItems.uomId) },
        { table: primaryUom, on: eq(primaryUom.id, inventoryItems.uomId) },
        {
          table: inventoryItemUomConversions,
          on: and(
            eq(inventoryItemUomConversions.inventoryItemId, supplierSiteItems.inventoryItemId),
            eq(inventoryItemUomConversions.uomId, supplierItems.uomId),
          ),
        },
        { table: current, on: undefined, lateral: true },
        { table: previous, on: undefined, lateral: true },
        { table: inventoryItemMrps, on: eq(inventoryItemMrps.id, current.mrpId) },
      ],
      where: and(
        eq(supplierSiteItems.inventoryItemId, options.inventoryItemId),
        exists(
          this.db
            .select({ one: sql`1` })
            .from(supplierItemPrices)
            .where(
              and(
                eq(supplierItemPrices.supplierItemId, supplierSiteItems.supplierItemId),
                or(eq(supplierItemPrices.siteId, supplierSiteItems.siteId), isNull(supplierItemPrices.siteId)),
              ),
            ),
        ),
        options.where,
      ),
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }
}
