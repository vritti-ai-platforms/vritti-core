import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import {
  and,
  asc,
  desc,
  eq,
  exists,
  getColumns,
  gte,
  inArray,
  isNull,
  like,
  lte,
  or,
  type SQL,
  sql,
} from '@vritti/api-sdk/drizzle-orm';
import {
  inventoryItemMrps,
  inventoryItems,
  type NewSupplierQuotationItem,
  parties,
  type SupplierQuotation,
  type SupplierQuotationItem,
  type SupplierQuotationSite,
  supplierQuotationItems,
  supplierQuotationSites,
  supplierQuotations,
  suppliers,
  uom,
} from '@/db/schema';

export type SupplierQuotationTableRow = SupplierQuotation & { itemCount: number; siteCount: number };

export type SupplierQuotationItemRow = SupplierQuotationItem & {
  inventoryItemName: string;
  uomSymbol: string | null;
  currencyCode: string;
  mrpAmount: bigint | null;
};

export type PurchaseQuotationRow = {
  id: string;
  quotationNumber: string;
  supplierId: string;
  supplierName: string;
  isPosted: boolean;
  validFrom: string;
  validTo: string | null;
  currencyCode: string;
};

export type PurchaseQuotationItemRow = {
  id: string;
  quotationId: string;
  purchaseItemId: string | null;
  inventoryItemId: string;
  inventoryItemName: string;
  uomId: string;
  uomSymbol: string;
  unitPrice: bigint;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  currencyCode: string;
};

export type PurchaseQuotationItemTermsRow = {
  id: string;
  quotationId: string;
  supplierId: string;
  purchaseItemId: string | null;
  inventoryItemId: string;
  uomId: string;
  currencyCode: string;
  unitPrice: bigint;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
};

@Injectable()
export class SupplierQuotationsDomainRepository extends PrimaryBaseRepository<typeof supplierQuotations> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierQuotations);
  }

  // Returns a supplier's quotations with their line and posted-site counts, or only those posted to one site
  findForSupplierTable(
    supplierId: string,
    options: { siteId?: string; where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: SupplierQuotationTableRow[]; count: number }> {
    const scope = and(
      eq(supplierQuotations.supplierId, supplierId),
      options.siteId
        ? sql`EXISTS (
            SELECT 1 FROM ${supplierQuotationSites} qs
            WHERE qs.quotation_id = ${supplierQuotations}.id AND qs.site_id = ${options.siteId}
          )`
        : undefined,
    );
    return this.findAllAndCount<SupplierQuotationTableRow>({
      select: {
        ...getColumns(supplierQuotations),
        itemCount: sql<number>`(
          SELECT count(*)::int FROM ${supplierQuotationItems} qi WHERE qi.quotation_id = ${supplierQuotations}.id
        )`.mapWith(Number),
        siteCount: sql<number>`(
          SELECT count(*)::int FROM ${supplierQuotationSites} qs WHERE qs.quotation_id = ${supplierQuotations}.id
        )`.mapWith(Number),
      },
      where: options.where ? and(scope, options.where) : scope,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(supplierQuotations.validFrom)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Loads a supplier's quotation only when it is posted to the site
  async findPostedToSite(
    supplierId: string,
    quotationId: string,
    siteId: string,
  ): Promise<SupplierQuotation | undefined> {
    const [row] = await this.db
      .select()
      .from(supplierQuotations)
      .where(
        and(
          eq(supplierQuotations.id, quotationId),
          eq(supplierQuotations.supplierId, supplierId),
          exists(
            this.db
              .select({ one: sql`1` })
              .from(supplierQuotationSites)
              .where(
                and(
                  eq(supplierQuotationSites.quotationId, supplierQuotations.id),
                  eq(supplierQuotationSites.siteId, siteId),
                ),
              ),
          ),
        ),
      )
      .limit(1);
    return row as SupplierQuotation | undefined;
  }

  // Returns the supplier's quotation numbers that start with the prefix
  async findNumbersStartingWith(supplierId: string, prefix: string): Promise<string[]> {
    const rows = await this.findAllWithSelect<{ quotationNumber: string }>({
      select: { quotationNumber: supplierQuotations.quotationNumber },
      where: and(eq(supplierQuotations.supplierId, supplierId), like(supplierQuotations.quotationNumber, `${prefix}%`)),
    });
    return rows.map((row) => row.quotationNumber);
  }

  // Returns the quotations a purchase requested with the supplier's name and whether each is posted to the site
  findForPurchase(purchaseId: string, siteId: string): Promise<PurchaseQuotationRow[]> {
    return this.findAllWithSelect<PurchaseQuotationRow>({
      select: {
        id: supplierQuotations.id,
        quotationNumber: supplierQuotations.quotationNumber,
        supplierId: supplierQuotations.supplierId,
        supplierName: parties.displayName,
        isPosted: this.postedToSite(siteId),
        validFrom: supplierQuotations.validFrom,
        validTo: supplierQuotations.validTo,
        currencyCode: supplierQuotations.currencyCode,
      },
      innerJoins: [
        { table: suppliers, on: eq(suppliers.id, supplierQuotations.supplierId) },
        { table: parties, on: eq(parties.id, suppliers.partyId) },
      ],
      where: eq(supplierQuotations.purchaseId, purchaseId),
      orderBy: [asc(supplierQuotations.createdAt)],
    });
  }

  // Returns the lines of every quotation a purchase requested with the item's name and the unit's symbol
  findItemsForPurchase(purchaseId: string): Promise<PurchaseQuotationItemRow[]> {
    return this.findAllWithSelect<PurchaseQuotationItemRow>({
      select: {
        id: supplierQuotationItems.id,
        quotationId: supplierQuotationItems.quotationId,
        purchaseItemId: supplierQuotationItems.purchaseItemId,
        inventoryItemId: supplierQuotationItems.inventoryItemId,
        inventoryItemName: inventoryItems.name,
        uomId: supplierQuotationItems.uomId,
        uomSymbol: uom.symbol,
        unitPrice: supplierQuotationItems.unitPrice,
        schemeBuyQty: supplierQuotationItems.schemeBuyQty,
        schemeFreeQty: supplierQuotationItems.schemeFreeQty,
        currencyCode: supplierQuotations.currencyCode,
      },
      innerJoins: [
        { table: supplierQuotationItems, on: eq(supplierQuotationItems.quotationId, supplierQuotations.id) },
        { table: inventoryItems, on: eq(inventoryItems.id, supplierQuotationItems.inventoryItemId) },
        { table: uom, on: eq(uom.id, supplierQuotationItems.uomId) },
      ],
      where: eq(supplierQuotations.purchaseId, purchaseId),
      orderBy: [asc(inventoryItems.name)],
    });
  }

  // Returns the given lines of the purchase's quotations that are posted to the site or its legal entity and valid on
  // the day
  findPostedItemsForPurchase(
    purchaseId: string,
    siteId: string,
    quotationItemIds: string[],
    onDate: string,
  ): Promise<PurchaseQuotationItemTermsRow[]> {
    return this.findAllWithSelect<PurchaseQuotationItemTermsRow>({
      select: {
        id: supplierQuotationItems.id,
        quotationId: supplierQuotationItems.quotationId,
        supplierId: supplierQuotations.supplierId,
        purchaseItemId: supplierQuotationItems.purchaseItemId,
        inventoryItemId: supplierQuotationItems.inventoryItemId,
        uomId: supplierQuotationItems.uomId,
        currencyCode: supplierQuotations.currencyCode,
        unitPrice: supplierQuotationItems.unitPrice,
        schemeBuyQty: supplierQuotationItems.schemeBuyQty,
        schemeFreeQty: supplierQuotationItems.schemeFreeQty,
      },
      innerJoin: { table: supplierQuotationItems, on: eq(supplierQuotationItems.quotationId, supplierQuotations.id) },
      where: and(
        eq(supplierQuotations.purchaseId, purchaseId),
        inArray(supplierQuotationItems.id, quotationItemIds),
        this.postedToSite(siteId),
        lte(supplierQuotations.validFrom, onDate),
        or(isNull(supplierQuotations.validTo), gte(supplierQuotations.validTo, onDate)),
      ),
    });
  }

  // Returns whether any quotation is linked to the purchase
  existsForPurchase(purchaseId: string): Promise<boolean> {
    return this.exists(eq(supplierQuotations.purchaseId, purchaseId));
  }

  // Counts the quotations linked to the purchase
  countForPurchase(purchaseId: string): Promise<number> {
    return this.count(eq(supplierQuotations.purchaseId, purchaseId));
  }

  // Counts the suppliers with a quotation for the purchase posted to the site or its legal entity
  async countPostedSuppliersForPurchase(purchaseId: string, siteId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(distinct ${supplierQuotations.supplierId})::int`.mapWith(Number) })
      .from(supplierQuotations)
      .where(and(eq(supplierQuotations.purchaseId, purchaseId), this.postedToSite(siteId)));
    return row?.count ?? 0;
  }

  // Inserts quotation lines
  async insertItems(rows: Omit<NewSupplierQuotationItem, 'organizationId'>[]): Promise<void> {
    await this.db.insert(supplierQuotationItems).values(rows);
  }

  // Matches a quotation posted to the site or to its whole legal entity
  private postedToSite(siteId: string): SQL {
    return exists(
      this.db
        .select({ one: sql`1` })
        .from(supplierQuotationSites)
        .where(
          and(
            eq(supplierQuotationSites.quotationId, supplierQuotations.id),
            or(eq(supplierQuotationSites.siteId, siteId), isNull(supplierQuotationSites.siteId)),
          ),
        ),
    );
  }

  async findByNumber(supplierId: string, quotationNumber: string): Promise<SupplierQuotation | undefined> {
    return this.model.findFirst({ where: { supplierId, quotationNumber } }) as Promise<SupplierQuotation | undefined>;
  }

  // Returns a quotation's lines with the item's name, the unit's symbol, the supplier's currency and the MRP amount
  async findItems(quotationId: string): Promise<SupplierQuotationItemRow[]> {
    const rows = await this.db
      .select({
        ...getColumns(supplierQuotationItems),
        inventoryItemName: inventoryItems.name,
        uomSymbol: uom.symbol,
        currencyCode: supplierQuotations.currencyCode,
        mrpAmount: inventoryItemMrps.amount,
      })
      .from(supplierQuotationItems)
      .innerJoin(supplierQuotations, eq(supplierQuotations.id, supplierQuotationItems.quotationId))
      .innerJoin(inventoryItems, eq(inventoryItems.id, supplierQuotationItems.inventoryItemId))
      .leftJoin(uom, eq(uom.id, supplierQuotationItems.uomId))
      .leftJoin(inventoryItemMrps, eq(inventoryItemMrps.id, supplierQuotationItems.mrpId))
      .where(eq(supplierQuotationItems.quotationId, quotationId))
      .orderBy(asc(inventoryItems.name));
    return rows as SupplierQuotationItemRow[];
  }

  async findItem(quotationId: string, id: string): Promise<SupplierQuotationItem | undefined> {
    const [row] = await this.db
      .select()
      .from(supplierQuotationItems)
      .where(and(eq(supplierQuotationItems.id, id), eq(supplierQuotationItems.quotationId, quotationId)))
      .limit(1);
    return row as SupplierQuotationItem | undefined;
  }

  async findItemByInventoryItem(
    quotationId: string,
    inventoryItemId: string,
    uomId: string,
  ): Promise<SupplierQuotationItem | undefined> {
    const [row] = await this.db
      .select()
      .from(supplierQuotationItems)
      .where(
        and(
          eq(supplierQuotationItems.quotationId, quotationId),
          eq(supplierQuotationItems.inventoryItemId, inventoryItemId),
          eq(supplierQuotationItems.uomId, uomId),
        ),
      )
      .limit(1);
    return row as SupplierQuotationItem | undefined;
  }

  async insertItem(data: Omit<NewSupplierQuotationItem, 'organizationId'>): Promise<SupplierQuotationItem> {
    const [row] = await this.db.insert(supplierQuotationItems).values(data).returning();
    return row as SupplierQuotationItem;
  }

  async updateItem(id: string, data: Partial<NewSupplierQuotationItem>): Promise<void> {
    await this.db.update(supplierQuotationItems).set(data).where(eq(supplierQuotationItems.id, id));
  }

  async deleteItem(id: string): Promise<void> {
    await this.db.delete(supplierQuotationItems).where(eq(supplierQuotationItems.id, id));
  }

  async findSites(quotationId: string): Promise<SupplierQuotationSite[]> {
    const rows = await this.db
      .select()
      .from(supplierQuotationSites)
      .where(eq(supplierQuotationSites.quotationId, quotationId))
      .orderBy(asc(supplierQuotationSites.createdAt));
    return rows as SupplierQuotationSite[];
  }

  // The quotation's posting to a site, or to the whole legal entity when the site is empty
  async findSite(quotationId: string, siteId: string | null): Promise<SupplierQuotationSite | undefined> {
    const [row] = await this.db
      .select()
      .from(supplierQuotationSites)
      .where(
        and(
          eq(supplierQuotationSites.quotationId, quotationId),
          siteId ? eq(supplierQuotationSites.siteId, siteId) : isNull(supplierQuotationSites.siteId),
        ),
      )
      .limit(1);
    return row as SupplierQuotationSite | undefined;
  }

  async countSites(quotationId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int`.mapWith(Number) })
      .from(supplierQuotationSites)
      .where(eq(supplierQuotationSites.quotationId, quotationId));
    return row?.count ?? 0;
  }

  async insertSite(data: {
    quotationId: string;
    siteId: string | null;
    postedBy: string | null;
  }): Promise<SupplierQuotationSite> {
    const [row] = await this.db.insert(supplierQuotationSites).values(data).returning();
    return row as SupplierQuotationSite;
  }

  async deleteSite(id: string): Promise<void> {
    await this.db.delete(supplierQuotationSites).where(eq(supplierQuotationSites.id, id));
  }
}
