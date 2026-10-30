import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq, getColumns, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  inventoryItemMrps,
  inventoryItems,
  type NewSupplierQuotationItem,
  type SupplierQuotation,
  type SupplierQuotationItem,
  type SupplierQuotationSite,
  supplierQuotationItems,
  supplierQuotationSites,
  supplierQuotations,
  uom,
} from '@/db/schema';

export type SupplierQuotationTableRow = SupplierQuotation & { itemCount: number; siteCount: number };

export type SupplierQuotationItemRow = SupplierQuotationItem & {
  inventoryItemName: string;
  uomSymbol: string | null;
  currencyCode: string;
  mrpAmount: bigint | null;
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

  async findSite(quotationId: string, siteId: string): Promise<SupplierQuotationSite | undefined> {
    const [row] = await this.db
      .select()
      .from(supplierQuotationSites)
      .where(and(eq(supplierQuotationSites.quotationId, quotationId), eq(supplierQuotationSites.siteId, siteId)))
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
    siteId: string;
    postedBy: string | null;
  }): Promise<SupplierQuotationSite> {
    const [row] = await this.db.insert(supplierQuotationSites).values(data).returning();
    return row as SupplierQuotationSite;
  }

  async deleteSite(id: string): Promise<void> {
    await this.db.delete(supplierQuotationSites).where(eq(supplierQuotationSites.id, id));
  }
}
