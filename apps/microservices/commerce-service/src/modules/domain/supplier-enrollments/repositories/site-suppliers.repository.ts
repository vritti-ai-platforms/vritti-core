import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService, type RepositoryJoin } from '@vritti/api-sdk/database';
import { and, eq, inArray, isNotNull, isNull, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import type { AnyPgColumn } from '@vritti/api-sdk/drizzle-pg-core';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { type SelectQueryResult, selectPageOptions } from '@vritti/api-sdk/select';
import {
  type PartyIdentifierType,
  parties,
  partyBankAccounts,
  partyIdentifiers,
  partyTaxRegistrations,
  paymentTerms,
  supplierEnrollments,
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

@Injectable()
export class SiteSuppliersDomainRepository extends PrimaryBaseRepository<typeof suppliers> {
  constructor(database: PrimaryDatabaseService) {
    super(database, suppliers);
  }

  // Every supplier of the legal entity with the site's enrollment when there is one — the site's suppliers table
  findForSiteTable(
    legalEntityId: string,
    siteId: string,
    options: { where?: SQL; orderBy: SQL[]; limit: number; offset: number },
  ): Promise<{ result: SupplierEnrollmentRowRecord[]; count: number }> {
    return this.findAllAndCount<SupplierEnrollmentRowRecord>({
      select: this.rowSelection(),
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
    siteId: string,
    supplierId: string,
  ): Promise<SupplierEnrollmentDetailRecord> {
    const row = await this.findById<SupplierEnrollmentDetailRecord>(supplierId, {
      select: {
        ...this.rowSelection(),
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

  // Paginated supplier options of the legal entity with each one's enrollment at the site; a picked value resolves even
  // when it no longer passes the picker's filters
  findForSiteSelect(
    legalEntityId: string,
    siteId: string,
    query: SupplierEnrollmentSelectQueryDto,
  ): Promise<SelectQueryResult> {
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
  private rowSelection() {
    return {
      id: supplierEnrollments.id,
      supplierId: suppliers.id,
      supplierCode: suppliers.code,
      partyId: suppliers.partyId,
      partyName: parties.displayName,
      partyType: parties.partyType,
      currencyCode: suppliers.currencyCode,
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

  // Joins the supplier's party, which every supplier has
  private partyJoin(): RepositoryJoin {
    return { table: parties, on: eq(parties.id, suppliers.partyId) };
  }

  // Joins the site's enrollment and its picks; every one is null when the supplier is not enrolled there
  private enrollmentJoins(siteId: string): RepositoryJoin[] {
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

  // Matches the site's enrollment row of the supplier
  private enrollmentAtSite(siteId: string): SQL {
    return and(eq(supplierEnrollments.supplierId, suppliers.id), eq(supplierEnrollments.siteId, siteId)) as SQL;
  }
}
