import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService, type RepositoryJoin } from '@vritti/api-sdk/database';
import { and, eq, exists, inArray, isNotNull, isNull, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import type { AnyPgColumn } from '@vritti/api-sdk/drizzle-pg-core';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { type SelectQueryResult, selectPageOptions } from '@vritti/api-sdk/select';
import {
  currentSiteId,
  hasSupplierItem,
  type PartyIdentifierType,
  parties,
  partyBankAccounts,
  partyIdentifiers,
  partyTaxRegistrations,
  paymentTerms,
  supplierEnrollments,
  supplierInvoices,
  supplierItems,
  supplierQuotationSites,
  supplierQuotations,
  supplierSiteItems,
  suppliers,
  TaxIdIdentifierTypes,
  taxJurisdictions,
} from '@/db/schema';
import { SupplierEnrollmentStatusValues } from '../dto/entity/supplier-enrollment-row.dto';
import type { SupplierEnrollmentSelectQueryDto } from '../dto/request/supplier-enrollment-select-query.dto';
import {
  orderEmail,
  orderParty,
  orderPhone,
  orderRel,
  type SupplierEnrollmentDetailRecord,
  type SupplierEnrollmentRowRecord,
} from './supplier-enrollments.repository';

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

// The rows a supplier's list tabs show at a site: the site lists the items it carries once enrolled, the supplier's whole
// catalog before
export type SupplierSiteCountsRow = {
  enrollmentId: string | null;
  itemCount: number;
  carriedItemCount: number;
  quotationCount: number;
  invoiceCount: number;
};

@Injectable()
export class SiteSuppliersDomainRepository extends PrimaryBaseRepository<typeof suppliers> {
  constructor(database: PrimaryDatabaseService) {
    super(database, suppliers);
  }

  // Every supplier of the legal entity with the site's enrollment when there is one — the site's suppliers table
  findForSiteTable(
    legalEntityId: string,
    options: { where?: SQL; orderBy: SQL[]; limit: number; offset: number },
    siteId?: string,
  ): Promise<{ result: SupplierEnrollmentRowRecord[]; count: number }> {
    return this.findAllAndCount<SupplierEnrollmentRowRecord>({
      select: this.rowSelection(siteId),
      innerJoin: this.partyJoin(),
      leftJoins: this.enrollmentJoins(siteId),
      where: and(eq(suppliers.legalEntityId, legalEntityId), options.where),
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Loads a supplier of the legal entity as one site sees it, enrolled or not, throwing when it does not exist
  async findDetailOrThrow(
    legalEntityId: string,
    supplierId: string,
    siteId?: string,
  ): Promise<SupplierEnrollmentDetailRecord> {
    const row = await this.findById<SupplierEnrollmentDetailRecord>(supplierId, {
      select: {
        ...this.rowSelection(siteId),
        partyTaxId: partyTaxIdField<string>(partyIdentifiers.idValue),
        partyTaxIdType: partyTaxIdField<PartyIdentifierType>(partyIdentifiers.idType),
      },
      innerJoin: this.partyJoin(),
      leftJoins: this.enrollmentJoins(siteId),
      where: eq(suppliers.legalEntityId, legalEntityId),
    });
    if (!row) throw new NotFoundException('Supplier not found.');
    return row;
  }

  // Counts a supplier's items, quotations and invoices as one site sees it, enrolled or not, throwing when it does not
  // exist
  async findCountsOrThrow(legalEntityId: string, supplierId: string, siteId?: string): Promise<SupplierSiteCountsRow> {
    const row = await this.findById<SupplierSiteCountsRow>(supplierId, {
      select: { enrollmentId: supplierEnrollments.id, ...this.siteCounts(siteId) },
      leftJoins: [{ table: supplierEnrollments, on: this.enrollmentAtSite(siteId) }],
      where: eq(suppliers.legalEntityId, legalEntityId),
    });
    if (!row) throw new NotFoundException('Supplier not found.');
    return row;
  }

  // Paginated supplier options of the legal entity with each one's enrollment at the site and, with suppliedItemIds,
  // whether it supplies the item there; a picked value resolves even when it no longer passes the picker's filters
  findForSiteSelect(
    legalEntityId: string,
    query: SupplierEnrollmentSelectQueryDto,
    { siteId, onlySupplying }: { siteId?: string; onlySupplying?: boolean } = {},
  ): Promise<SelectQueryResult> {
    const supplies = query.suppliedItemIds?.length ? hasSupplierItem(suppliers.id, query.suppliedItemIds) : undefined;
    const conditions: SQL[] = [eq(suppliers.legalEntityId, legalEntityId)];
    if (!query.values) {
      if (query.enrollmentStatus) {
        conditions.push(
          query.enrollmentStatus === SupplierEnrollmentStatusValues.ENROLLED
            ? isNotNull(supplierEnrollments.id)
            : isNull(supplierEnrollments.id),
        );
      }
      if (query.activeOnly) {
        conditions.push(
          eq(suppliers.isActive, true),
          or(isNull(supplierEnrollments.id), eq(supplierEnrollments.isActive, true)) as SQL,
        );
      }
      if (supplies && onlySupplying) conditions.push(supplies);
    }
    return this.findForSelect({
      ...selectPageOptions(query),
      value: 'id',
      label: 'displayName',
      description: 'code',
      additionalKeys: [
        'code',
        'currencyCode',
        'currencyCodes',
        'defaultPaymentTermId',
        'paymentTermId',
        'purchasingBlocked',
      ],
      additionalExpressions: {
        enrollmentStatus: sql`case when ${supplierEnrollments.id} is null then ${SupplierEnrollmentStatusValues.NOT_ENROLLED} else ${SupplierEnrollmentStatusValues.ENROLLED} end`,
        isActive: sql`${suppliers.isActive} and coalesce(${supplierEnrollments.isActive}, true)`,
        ...(supplies ? { suppliesItem: sql<boolean>`${supplies}` } : {}),
      },
      searchKeys: ['displayName', 'code'],
      orderByKey: 'displayName',
      orderDirection: 'asc',
      joins: [
        { table: parties, on: eq(parties.id, suppliers.partyId), type: 'inner' },
        { table: supplierEnrollments, on: this.enrollmentAtSite(siteId), type: 'left' },
      ],
      conditions,
    });
  }

  // Selects the shared enrollment row columns of a supplier at a site, enrolled or not
  private rowSelection(siteId?: string) {
    return {
      id: supplierEnrollments.id,
      siteId: sql<string>`${siteId ?? currentSiteId()}`,
      supplierId: suppliers.id,
      supplierCode: suppliers.code,
      partyId: suppliers.partyId,
      partyName: parties.displayName,
      partyType: parties.partyType,
      currencyCode: suppliers.currencyCode,
      currencyCodes: suppliers.currencyCodes,
      defaultPaymentTermId: suppliers.defaultPaymentTermId,
      isActive: supplierEnrollments.isActive,
      isSupplierActive: suppliers.isActive,
      purchasingBlocked: suppliers.purchasingBlocked,
      paymentBlocked: suppliers.paymentBlocked,
      paymentTermId: supplierEnrollments.paymentTermId,
      paymentTermName: paymentTerms.name,
      partyTaxRegistrationId: supplierEnrollments.partyTaxRegistrationId,
      registrationNumber: partyTaxRegistrations.registrationNumber,
      registrationCountryCode: partyTaxRegistrations.countryCode,
      registrationJurisdictionName: taxJurisdictions.name,
      partyBankAccountId: supplierEnrollments.partyBankAccountId,
      bankAccountName: partyBankAccounts.accountName,
      orderRelationshipId: supplierEnrollments.orderRelationshipId,
      orderContactLabel: orderRel.jobTitle,
      orderContactName: orderParty.displayName,
      orderEmailCommunicationId: supplierEnrollments.orderEmailCommunicationId,
      orderEmail: orderEmail.value,
      orderPhoneCommunicationId: supplierEnrollments.orderPhoneCommunicationId,
      orderPhone: orderPhone.value,
      enrolledAt: supplierEnrollments.createdAt,
    };
  }

  // Counts the rows each of a supplier's list tabs shows at a site. A named site is one the legal entity reads: its
  // quotations are those posted to it and its invoices those entered there; the request's site reads its own through RLS
  private siteCounts(siteId?: string) {
    const supplierItemIds = this.db
      .select({ id: supplierItems.id })
      .from(supplierItems)
      .where(eq(supplierItems.supplierId, suppliers.id));
    const postedToSite = siteId
      ? exists(
          this.db
            .select({ one: sql`1` })
            .from(supplierQuotationSites)
            .where(
              and(
                eq(supplierQuotationSites.quotationId, supplierQuotations.id),
                eq(supplierQuotationSites.siteId, siteId),
              ),
            ),
        )
      : undefined;
    return {
      itemCount: this.db.$count(supplierItems, eq(supplierItems.supplierId, suppliers.id)),
      carriedItemCount: this.db.$count(
        supplierSiteItems,
        and(
          eq(supplierSiteItems.siteId, siteId ?? currentSiteId()),
          inArray(supplierSiteItems.supplierItemId, supplierItemIds),
        ),
      ),
      quotationCount: this.db.$count(
        supplierQuotations,
        and(eq(supplierQuotations.supplierId, suppliers.id), postedToSite),
      ),
      invoiceCount: this.db.$count(
        supplierInvoices,
        and(eq(supplierInvoices.supplierId, suppliers.id), siteId ? eq(supplierInvoices.siteId, siteId) : undefined),
      ),
    };
  }

  // Joins the supplier's party, which every supplier has
  private partyJoin(): RepositoryJoin {
    return { table: parties, on: eq(parties.id, suppliers.partyId) };
  }

  // Joins the site's enrollment and its picks; every one is null when the supplier is not enrolled there
  private enrollmentJoins(siteId?: string): RepositoryJoin[] {
    return [
      { table: supplierEnrollments, on: this.enrollmentAtSite(siteId) },
      { table: paymentTerms, on: eq(paymentTerms.id, supplierEnrollments.paymentTermId) },
      { table: partyTaxRegistrations, on: eq(partyTaxRegistrations.id, supplierEnrollments.partyTaxRegistrationId) },
      { table: taxJurisdictions, on: eq(taxJurisdictions.id, partyTaxRegistrations.jurisdictionId) },
      { table: partyBankAccounts, on: eq(partyBankAccounts.id, supplierEnrollments.partyBankAccountId) },
      { table: orderRel, on: eq(orderRel.id, supplierEnrollments.orderRelationshipId) },
      { table: orderParty, on: eq(orderParty.id, orderRel.childPartyId) },
      { table: orderEmail, on: eq(orderEmail.id, supplierEnrollments.orderEmailCommunicationId) },
      { table: orderPhone, on: eq(orderPhone.id, supplierEnrollments.orderPhoneCommunicationId) },
    ];
  }

  // Matches the enrollment row of the supplier at the named site, else at the request's site
  private enrollmentAtSite(siteId?: string): SQL {
    return and(
      eq(supplierEnrollments.supplierId, suppliers.id),
      eq(supplierEnrollments.siteId, siteId ?? currentSiteId()),
    ) as SQL;
  }
}
