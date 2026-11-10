import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import {
  and,
  asc,
  desc,
  eq,
  exists,
  getColumns,
  inArray,
  notInArray,
  type SQL,
  sql,
} from '@vritti/api-sdk/drizzle-orm';
import type { AnyPgColumn } from '@vritti/api-sdk/drizzle-pg-core';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import { type FindForSelectConfig, type SelectQueryResult } from '@vritti/api-sdk/select';
import {
  type PartyIdentifierType,
  type PartyLicense,
  type PartyTaxRegistration,
  type PartyType,
  PurchaseOrderStatusValues,
  parties,
  partyIdentifiers,
  partyLicenses,
  partyTaxRegistrations,
  paymentTerms,
  purchaseOrders,
  type Supplier,
  supplierEnrollments,
  supplierItemPrices,
  supplierItems,
  supplierQuotations,
  suppliers,
  TaxIdIdentifierTypes,
  taxJurisdictions,
} from '@/db/schema';

// One field of the party's tax ID — the primary active identifier of a tax-ID type — or null when it has none on record
const partyTaxIdField = <T>(column: AnyPgColumn) =>
  sql<T | null>`(
    SELECT ${column} FROM ${partyIdentifiers}
    WHERE ${partyIdentifiers.partyId} = ${suppliers.partyId}
      AND ${inArray(partyIdentifiers.idType, TaxIdIdentifierTypes)}
      AND ${partyIdentifiers.isActive} = true
    ORDER BY ${partyIdentifiers.isPrimary} DESC, ${partyIdentifiers.createdAt} ASC
    LIMIT 1
  )`;

export type SupplierRegistrationRow = PartyTaxRegistration & { jurisdictionName: string | null };

export type SupplierWithParty = Supplier & { partyName: string; defaultPaymentTermName: string };

export type SupplierDetailRow = SupplierWithParty & {
  partyType: PartyType;
  partyTaxId: string | null;
  partyTaxIdType: PartyIdentifierType | null;
  registrations: SupplierRegistrationRow[];
  licenses: PartyLicense[];
  enrolledSiteCount: number;
  itemCount: number;
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

  // Paginated supplier options; activeOnly drops inactive suppliers and inventoryItemId keeps those supplying the item
  override findForSelect(
    config: FindForSelectConfig,
    options?: { activeOnly?: boolean; inventoryItemId?: string },
  ): Promise<SelectQueryResult> {
    const conditions: SQL[] = [];
    if (options?.activeOnly) conditions.push(eq(suppliers.isActive, true));
    if (options?.inventoryItemId) {
      conditions.push(
        exists(
          this.db
            .select({ one: sql`1` })
            .from(supplierItems)
            .where(
              and(
                eq(supplierItems.supplierId, suppliers.id),
                eq(supplierItems.inventoryItemId, options.inventoryItemId),
              ),
            ),
        ),
      );
    }
    return super.findForSelect({
      ...config,
      joins: [{ table: parties, on: eq(parties.id, suppliers.partyId), type: 'inner' }],
      conditions,
    });
  }

  // Returns paginated suppliers joined with their party display name, plus total count
  findAllWithParty(options?: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: SupplierWithParty[];
    count: number;
  }> {
    return this.findAllAndCount<SupplierWithParty>({
      select: { ...getColumns(suppliers), partyName: parties.displayName, defaultPaymentTermName: paymentTerms.name },
      innerJoins: [
        { table: parties, on: eq(parties.id, suppliers.partyId) },
        { table: paymentTerms, on: eq(paymentTerms.id, suppliers.defaultPaymentTermId) },
      ],
      where: options?.where,
      orderBy: options?.orderBy,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  // Loads a supplier by id joined with its party display name
  async findByIdWithParty(id: string): Promise<SupplierWithParty | undefined> {
    const { result } = await this.findAllWithParty({ where: eq(suppliers.id, id), limit: 1, offset: 0 });
    return result[0];
  }

  // Loads a supplier by id, throwing when it does not exist
  async findByIdOrThrow(id: string): Promise<Supplier> {
    const entity = await this.findById(id);
    if (!entity) throw new NotFoundException('Supplier not found.');
    return entity;
  }

  // Loads a supplier joined with its party display name, throwing when it does not exist
  async findWithPartyOrThrow(id: string): Promise<SupplierWithParty> {
    const entity = await this.findByIdWithParty(id);
    if (!entity) throw new NotFoundException('Supplier not found.');
    return entity;
  }

  // Loads a supplier with party name, the party's registrations (with their jurisdiction) and licenses, and its enrollment and item counts
  async findDetailOrThrow(id: string): Promise<SupplierDetailRow> {
    const [row] = await this.db
      .select({
        ...getColumns(suppliers),
        partyName: parties.displayName,
        partyType: parties.partyType,
        partyTaxId: partyTaxIdField<string>(partyIdentifiers.idValue),
        partyTaxIdType: partyTaxIdField<PartyIdentifierType>(partyIdentifiers.idType),
        defaultPaymentTermName: paymentTerms.name,
        enrolledSiteCount: sql<number>`(
          SELECT count(*)::int FROM ${supplierEnrollments} se
          WHERE se.supplier_id = ${suppliers}.id
        )`.mapWith(Number),
        itemCount: sql<number>`(
          SELECT count(*)::int FROM ${supplierItems} si
          WHERE si.supplier_id = ${suppliers}.id
        )`.mapWith(Number),
      })
      .from(suppliers)
      .innerJoin(parties, eq(parties.id, suppliers.partyId))
      .innerJoin(paymentTerms, eq(paymentTerms.id, suppliers.defaultPaymentTermId))
      .where(eq(suppliers.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Supplier not found.');

    const supplier = row as Omit<SupplierDetailRow, 'registrations' | 'licenses'>;
    const [registrations, licenses] = await Promise.all([
      this.db
        .select({ ...getColumns(partyTaxRegistrations), jurisdictionName: taxJurisdictions.name })
        .from(partyTaxRegistrations)
        .leftJoin(taxJurisdictions, eq(taxJurisdictions.id, partyTaxRegistrations.jurisdictionId))
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
      registrations,
      licenses: licenses as PartyLicense[],
    };
  }

  // Rejects a default payment term that is not a published term of the caller's organization
  async assertDefaultPaymentTermUsable(id: string): Promise<void> {
    const [term] = await this.db
      .select({ isPublished: paymentTerms.isPublished })
      .from(paymentTerms)
      .where(eq(paymentTerms.id, id))
      .limit(1);
    if (term?.isPublished === true) return;
    throw new BadRequestException({
      label: 'Invalid Default Payment Term',
      detail: 'The selected default payment term does not exist or is still a draft.',
      errors: [{ field: 'defaultPaymentTermId', message: 'Pick a published payment term' }],
    });
  }

  // Rejects a party that is already a supplier of the caller's legal entity
  async assertPartyFree(partyId: string): Promise<void> {
    if (!(await this.exists(eq(suppliers.partyId, partyId)))) return;
    throw new ConflictException({
      label: 'Already A Supplier',
      detail: 'This party is already a supplier for this legal entity.',
      errors: [{ field: 'partyId', message: 'Already a supplier' }],
    });
  }

  // Rejects deleting a supplier that purchase orders, quotations or item prices still reference
  async assertNotReferenced(supplier: SupplierWithParty): Promise<void> {
    const refs = await this.countReferences(supplier.id);
    const parts = (
      [
        [refs.purchaseOrders, 'purchase order'],
        [refs.quotations, 'quotation'],
        [refs.prices, 'item price'],
      ] as const
    )
      .filter(([n]) => n > 0)
      .map(([n, label]) => `${n} ${pluralize(label, n)}`);
    if (parts.length === 0) return;
    throw new ConflictException({
      label: 'Supplier In Use',
      detail: `Cannot delete "${supplier.partyName}" — it is referenced by ${parts.join(', ')}. Remove those references first.`,
    });
  }

  // Rejects dropping currencies still used by the supplier's prices, quotations or open purchase orders
  async assertCurrenciesUnused(id: string, dropped: string[]): Promise<void> {
    if (dropped.length === 0) return;
    const usage = await this.countCurrencyUsage(id, dropped);
    const uses = (
      [
        ['price', usage.prices],
        ['quotation', usage.quotations],
        ['open purchase order', usage.purchaseOrders],
      ] as const
    )
      .filter(([, count]) => count > 0)
      .map(([noun, count]) => pluralize(noun, count, true));
    if (uses.length === 0) return;
    throw new ConflictException({
      label: 'Currency In Use',
      detail: `${dropped.join(', ')} cannot be removed while ${uses.join(', ')} of this supplier use it.`,
      errors: [{ field: 'currencyCodes', message: `${dropped.join(', ')} is still in use` }],
    });
  }

  // Counts the purchase orders, quotations and item prices that keep a supplier from being deleted
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

  // Sets the default payment term of suppliers by ID; returns how many changed
  async bulkSetDefaultPaymentTerm(ids: string[], defaultPaymentTermId: string): Promise<number> {
    const rows = await this.db
      .update(suppliers)
      .set({ defaultPaymentTermId })
      .where(inArray(suppliers.id, ids))
      .returning({ id: suppliers.id });
    return rows.length;
  }
}
