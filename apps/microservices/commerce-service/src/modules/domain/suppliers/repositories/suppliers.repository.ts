import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq, getColumns, inArray, notInArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type FindForSelectConfig, type SelectQueryResult } from '@vritti/api-sdk/select';
import {
  type PartyLicense,
  type PartyTaxRegistration,
  type PartyType,
  PaymentTermStatusValues,
  PurchaseOrderStatusValues,
  parties,
  partyBankAccounts,
  partyLicenses,
  partyTaxRegistrations,
  paymentTerms,
  purchaseOrders,
  type Supplier,
  supplierItemPrices,
  supplierItems,
  supplierQuotations,
  supplierSites,
  suppliers,
} from '@/db/schema';
import { type SiteEnrollmentStatus, SiteEnrollmentStatusValues } from '../dto/entity/site-supplier-list-row.dto';

// Narrows a supplier pick list to the suppliers with a price for an inventory item at a site within a date window
export interface PricedItemAtSite {
  inventoryItemId: string;
  siteId: string;
  from?: string;
  to?: string;
}

export type SupplierAtSiteRow = Supplier & {
  partyName: string;
  enrollmentId: string | null;
  paymentTermId: string | null;
  paymentTermName: string | null;
  partyTaxRegistrationId: string | null;
  registrationNumber: string | null;
  partyBankAccountId: string | null;
  bankAccountName: string | null;
  orderRelationshipId: string | null;
  enrolledAt: Date | null;
};

export type SiteSupplierListRow = Supplier & {
  partyName: string;
  enrollmentId: string | null;
  paymentTermId: string | null;
  paymentTermName: string | null;
  enrolledAt: Date | null;
};

// Purchase orders that are done with and no longer hold a supplier to their currency
const CLOSED_PURCHASE_ORDER_STATUSES = [
  PurchaseOrderStatusValues.RECEIVED,
  PurchaseOrderStatusValues.CLOSED,
  PurchaseOrderStatusValues.CANCELLED,
  PurchaseOrderStatusValues.REJECTED,
];

@Injectable()
export class SuppliersDomainRepository extends PrimaryBaseRepository<typeof suppliers> {
  constructor(database: PrimaryDatabaseService) {
    super(database, suppliers);
  }

  // Paginated supplier options; given a site, each option carries its enrollment status there (`enrollmentStatus`
  // additional) and `enrollmentStatus` narrows to enrolled or not-enrolled suppliers
  override findForSelect(
    config: FindForSelectConfig,
    options?: { siteId?: string; enrollmentStatus?: SiteEnrollmentStatus; pricedItem?: PricedItemAtSite },
  ): Promise<SelectQueryResult> {
    const siteId = options?.siteId;
    const enrolledAtSite = siteId
      ? sql`EXISTS (SELECT 1 FROM ${supplierSites} ss WHERE ss.supplier_id = ${suppliers.id} AND ss.site_id = ${siteId}::uuid)`
      : undefined;
    const conditions: SQL[] = [];
    if (enrolledAtSite && options?.enrollmentStatus) {
      conditions.push(
        options.enrollmentStatus === SiteEnrollmentStatusValues.ENROLLED ? enrolledAtSite : sql`NOT ${enrolledAtSite}`,
      );
    }
    const priced = options?.pricedItem;
    if (priced) {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM ${supplierItemPrices}
        INNER JOIN ${supplierItems} ON ${supplierItems.id} = ${supplierItemPrices.supplierItemId}
        WHERE ${supplierItems.supplierId} = ${suppliers.id}
          AND ${supplierItems.inventoryItemId} = ${priced.inventoryItemId}
          AND ${supplierItemPrices.siteId} = ${priced.siteId}
          ${priced.to ? sql`AND ${supplierItemPrices.validFrom} <= ${priced.to}::date` : sql``}
          ${priced.from ? sql`AND (${supplierItemPrices.validTo} IS NULL OR ${supplierItemPrices.validTo} >= ${priced.from}::date)` : sql``}
      )`);
    }

    return super.findForSelect({
      ...config,
      joins: [{ table: parties, on: eq(parties.id, suppliers.partyId), type: 'inner' }],
      conditions,
      additionalExpressions: enrolledAtSite
        ? {
            enrollmentStatus: sql<SiteEnrollmentStatus>`CASE WHEN ${enrolledAtSite} THEN ${SiteEnrollmentStatusValues.ENROLLED} ELSE ${SiteEnrollmentStatusValues.NOT_ENROLLED} END`,
          }
        : undefined,
    });
  }

  // Returns paginated suppliers joined with their party display name, plus total count
  findAllWithParty(options?: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: (Supplier & { partyName: string | null; defaultPaymentTermName: string | null })[];
    count: number;
  }> {
    return this.findAllAndCount<Supplier & { partyName: string | null; defaultPaymentTermName: string | null }>({
      select: { ...getColumns(suppliers), partyName: parties.displayName, defaultPaymentTermName: paymentTerms.name },
      innerJoins: [{ table: parties, on: eq(parties.id, suppliers.partyId) }],
      leftJoins: [{ table: paymentTerms, on: eq(paymentTerms.id, suppliers.defaultPaymentTermId) }],
      where: options?.where,
      orderBy: options?.orderBy,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  // Loads a supplier by id joined with its party display name
  async findByIdWithParty(
    id: string,
  ): Promise<(Supplier & { partyName: string | null; defaultPaymentTermName: string | null }) | undefined> {
    const { result } = await this.findAllWithParty({ where: eq(suppliers.id, id), limit: 1, offset: 0 });
    return result[0];
  }

  // Loads a supplier with party name, the party's registrations and licenses, and its enrollment and item counts
  async findDetailById(id: string): Promise<
    | (Supplier & {
        partyName: string | null;
        partyType: PartyType | null;
        defaultPaymentTermName: string | null;
        registrations: PartyTaxRegistration[];
        licenses: PartyLicense[];
        enrolledSiteCount: number;
        itemCount: number;
      })
    | undefined
  > {
    const [row] = await this.db
      .select({
        ...getColumns(suppliers),
        partyName: parties.displayName,
        partyType: parties.partyType,
        defaultPaymentTermName: paymentTerms.name,
        enrolledSiteCount: sql<number>`(
          SELECT count(*)::int FROM ${supplierSites} ss
          WHERE ss.supplier_id = ${suppliers}.id
        )`.mapWith(Number),
        itemCount: sql<number>`(
          SELECT count(*)::int FROM ${supplierItems} si
          WHERE si.supplier_id = ${suppliers}.id
        )`.mapWith(Number),
      })
      .from(suppliers)
      .innerJoin(parties, eq(parties.id, suppliers.partyId))
      .leftJoin(paymentTerms, eq(paymentTerms.id, suppliers.defaultPaymentTermId))
      .where(eq(suppliers.id, id))
      .limit(1);
    if (!row) return undefined;

    const supplier = row as Supplier & {
      partyName: string | null;
      partyType: PartyType | null;
      defaultPaymentTermName: string | null;
      enrolledSiteCount: number;
      itemCount: number;
    };
    const [registrations, licenses] = await Promise.all([
      this.db
        .select()
        .from(partyTaxRegistrations)
        .where(eq(partyTaxRegistrations.partyId, supplier.partyId))
        .orderBy(desc(partyTaxRegistrations.isPrimary), asc(partyTaxRegistrations.createdAt)),
      this.db
        .select()
        .from(partyLicenses)
        .where(eq(partyLicenses.partyId, supplier.partyId))
        .orderBy(asc(partyLicenses.createdAt)),
    ]);

    return {
      ...supplier,
      registrations: registrations as PartyTaxRegistration[],
      licenses: licenses as PartyLicense[],
    };
  }

  // Returns true when the payment term is visible to the caller's organization and active
  async isPaymentTermUsable(id: string): Promise<boolean> {
    const [term] = await this.db
      .select({ status: paymentTerms.status })
      .from(paymentTerms)
      .where(eq(paymentTerms.id, id))
      .limit(1);
    return term?.status === PaymentTermStatusValues.ACTIVE;
  }

  // Counts non-cascading references to this supplier
  // What keeps a supplier from being deleted: its purchase orders, its quotations and its items' price history
  async countReferences(id: string): Promise<{ purchaseOrders: number; quotations: number; prices: number }> {
    const count = sql<number>`count(*)::int`.mapWith(Number);
    const [[orders], [quotations], [prices]] = await Promise.all([
      this.db.select({ count }).from(purchaseOrders).where(eq(purchaseOrders.supplierId, id)),
      this.db.select({ count }).from(supplierQuotations).where(eq(supplierQuotations.supplierId, id)),
      this.db
        .select({ count })
        .from(supplierItemPrices)
        .innerJoin(supplierItems, eq(supplierItems.id, supplierItemPrices.supplierItemId))
        .where(eq(supplierItems.supplierId, id)),
    ]);
    return {
      purchaseOrders: orders?.count ?? 0,
      quotations: quotations?.count ?? 0,
      prices: prices?.count ?? 0,
    };
  }

  // How many of the supplier's prices, quotations and open purchase orders are in any of the given currencies
  async countCurrencyUsage(
    id: string,
    currencyCodes: string[],
  ): Promise<{ prices: number; quotations: number; purchaseOrders: number }> {
    const count = sql<number>`count(*)::int`.mapWith(Number);
    const [[prices], [quotations], [orders]] = await Promise.all([
      this.db
        .select({ count })
        .from(supplierItemPrices)
        .innerJoin(supplierItems, eq(supplierItems.id, supplierItemPrices.supplierItemId))
        .where(and(eq(supplierItems.supplierId, id), inArray(supplierItemPrices.currencyCode, currencyCodes))),
      this.db
        .select({ count })
        .from(supplierQuotations)
        .where(and(eq(supplierQuotations.supplierId, id), inArray(supplierQuotations.currencyCode, currencyCodes))),
      this.db
        .select({ count })
        .from(purchaseOrders)
        .where(
          and(
            eq(purchaseOrders.supplierId, id),
            inArray(purchaseOrders.currencyCode, currencyCodes),
            notInArray(purchaseOrders.status, CLOSED_PURCHASE_ORDER_STATUSES),
          ),
        ),
    ]);
    return { prices: prices?.count ?? 0, quotations: quotations?.count ?? 0, purchaseOrders: orders?.count ?? 0 };
  }

  // Activates or deactivates suppliers by ID; returns how many changed
  async bulkSetActive(ids: string[], isActive: boolean): Promise<number> {
    const rows = await this.db
      .update(suppliers)
      .set({ isActive })
      .where(inArray(suppliers.id, ids))
      .returning({ id: suppliers.id });
    return rows.length;
  }

  // Every supplier of the legal entity with the site's enrollment when there is one — the site's suppliers list
  findForSiteList(
    legalEntityId: string,
    siteId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number },
  ): Promise<{ result: SiteSupplierListRow[]; count: number }> {
    const scope = eq(suppliers.legalEntityId, legalEntityId);
    return this.findAllAndCount<SiteSupplierListRow>({
      select: {
        ...getColumns(suppliers),
        partyName: parties.displayName,
        enrollmentId: supplierSites.id,
        paymentTermId: supplierSites.paymentTermId,
        paymentTermName: paymentTerms.name,
        enrolledAt: supplierSites.createdAt,
      },
      innerJoins: [{ table: parties, on: eq(parties.id, suppliers.partyId) }],
      leftJoins: [
        {
          table: supplierSites,
          on: and(eq(supplierSites.supplierId, suppliers.id), eq(supplierSites.siteId, siteId)),
        },
        { table: paymentTerms, on: eq(paymentTerms.id, supplierSites.paymentTermId) },
      ],
      where: options.where ? and(scope, options.where) : scope,
      orderBy: options.orderBy?.length ? options.orderBy : [sql`${supplierSites.id} IS NULL`, asc(parties.displayName)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  findAtSite(
    legalEntityId: string,
    siteId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number },
  ): Promise<{ result: SupplierAtSiteRow[]; count: number }> {
    const scope = eq(suppliers.legalEntityId, legalEntityId);
    return this.findAllAndCount<SupplierAtSiteRow>({
      select: {
        ...getColumns(suppliers),
        partyName: parties.displayName,
        enrollmentId: supplierSites.id,
        paymentTermId: supplierSites.paymentTermId,
        paymentTermName: paymentTerms.name,
        partyTaxRegistrationId: supplierSites.partyTaxRegistrationId,
        registrationNumber: partyTaxRegistrations.registrationNumber,
        partyBankAccountId: supplierSites.partyBankAccountId,
        bankAccountName: partyBankAccounts.accountName,
        orderRelationshipId: supplierSites.orderRelationshipId,
        enrolledAt: supplierSites.createdAt,
      },
      innerJoins: [{ table: parties, on: eq(parties.id, suppliers.partyId) }],
      leftJoins: [
        {
          table: supplierSites,
          on: and(eq(supplierSites.supplierId, suppliers.id), eq(supplierSites.siteId, siteId)),
        },
        { table: paymentTerms, on: eq(paymentTerms.id, supplierSites.paymentTermId) },
        { table: partyTaxRegistrations, on: eq(partyTaxRegistrations.id, supplierSites.partyTaxRegistrationId) },
        { table: partyBankAccounts, on: eq(partyBankAccounts.id, supplierSites.partyBankAccountId) },
      ],
      where: options.where ? and(scope, options.where) : scope,
      orderBy: options.orderBy?.length ? options.orderBy : [asc(parties.displayName)],
      limit: options.limit,
      offset: options.offset,
    });
  }
}
