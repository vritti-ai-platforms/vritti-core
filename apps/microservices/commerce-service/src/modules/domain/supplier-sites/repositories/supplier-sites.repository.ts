import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, getTableColumns, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { alias } from '@vritti/api-sdk/drizzle-pg-core';
import {
  type PartyBankAccount,
  type PartyRelationship,
  type PartyTaxRegistration,
  PartyCommunicationChannelValues,
  parties,
  partyBankAccounts,
  partyCommunications,
  partyRelationships,
  partyTaxRegistrations,
  type Supplier,
  type SupplierSite,
  supplierSites,
  suppliers,
  type TaxRegistrationType,
} from '@/db/schema';

const orderRel = alias(partyRelationships, 'order_rel');
const orderParty = alias(parties, 'order_party');
const orderEmail = alias(partyCommunications, 'order_email');
const orderPhone = alias(partyCommunications, 'order_phone');

const orderContactJoins = [
  { table: orderRel, on: eq(orderRel.id, supplierSites.orderRelationshipId) },
  { table: orderParty, on: eq(orderParty.id, orderRel.childPartyId) },
  {
    table: orderEmail,
    on: and(
      eq(orderEmail.partyId, orderRel.childPartyId),
      eq(orderEmail.channel, PartyCommunicationChannelValues.EMAIL),
      eq(orderEmail.isPrimary, true),
    ),
  },
  {
    table: orderPhone,
    on: and(
      eq(orderPhone.partyId, orderRel.childPartyId),
      eq(orderPhone.channel, PartyCommunicationChannelValues.PHONE),
      eq(orderPhone.isPrimary, true),
    ),
  },
];

const orderContactSelect = {
  orderContactLabel: orderRel.jobTitle,
  orderContactName: orderParty.displayName,
  orderContactEmail: orderEmail.value,
  orderContactPhone: orderPhone.value,
};

type SupplierSiteWithPicks = SupplierSite & {
  registrationNumber: string | null;
  registrationType: TaxRegistrationType | null;
  bankAccountName: string | null;
  bankName: string | null;
  orderContactLabel: string | null;
  orderContactName: string | null;
  orderContactEmail: string | null;
  orderContactPhone: string | null;
};

type SiteSupplierRow = SupplierSite & {
  supplierName: string | null;
  supplierCode: string | null;
  currencyCode: string | null;
  purchasingBlocked: boolean | null;
};

@Injectable()
export class SupplierSitesDomainRepository extends PrimaryBaseRepository<typeof supplierSites> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierSites);
  }

  // Returns paginated enrollments of a supplier joined with the picked registration, bank account, and order contact
  findForSupplierTable(
    supplierId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: SupplierSiteWithPicks[]; count: number }> {
    const baseWhere = eq(supplierSites.supplierId, supplierId);
    const where = options.where ? and(baseWhere, options.where) : baseWhere;
    return this.findAllAndCount<SupplierSiteWithPicks>({
      select: {
        ...getTableColumns(supplierSites),
        registrationNumber: partyTaxRegistrations.registrationNumber,
        registrationType: partyTaxRegistrations.registrationType,
        bankAccountName: partyBankAccounts.accountName,
        bankName: partyBankAccounts.bankName,
        ...orderContactSelect,
      },
      leftJoins: [
        { table: partyTaxRegistrations, on: eq(partyTaxRegistrations.id, supplierSites.partyTaxRegistrationId) },
        { table: partyBankAccounts, on: eq(partyBankAccounts.id, supplierSites.partyBankAccountId) },
        ...orderContactJoins,
      ],
      where,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(supplierSites.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns the current site's enrollments joined with supplier identity — scoped by the session site GUC
  findForSiteTable(options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number }): Promise<{
    result: SiteSupplierRow[];
    count: number;
  }> {
    const baseWhere = sql`${supplierSites.siteId} = current_setting('app.site_id', true)::uuid`;
    const where = options.where ? and(baseWhere, options.where) : baseWhere;
    return this.findAllAndCount<SiteSupplierRow>({
      select: {
        ...getTableColumns(supplierSites),
        supplierName: parties.displayName,
        supplierCode: suppliers.code,
        currencyCode: suppliers.currencyCode,
        purchasingBlocked: suppliers.purchasingBlocked,
      },
      leftJoins: [
        { table: suppliers, on: eq(suppliers.id, supplierSites.supplierId) },
        { table: parties, on: eq(parties.id, suppliers.partyId) },
      ],
      where,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(supplierSites.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Loads a supplier row for enrollment validation
  async findSupplier(supplierId: string): Promise<Supplier | undefined> {
    const [row] = await this.db.select().from(suppliers).where(eq(suppliers.id, supplierId)).limit(1);
    return row as Supplier | undefined;
  }

  // Loads a tax registration for pick validation
  async findRegistrationById(id: string): Promise<PartyTaxRegistration | undefined> {
    const [row] = await this.db.select().from(partyTaxRegistrations).where(eq(partyTaxRegistrations.id, id)).limit(1);
    return row as PartyTaxRegistration | undefined;
  }

  // Returns up to two active registrations of a party — used to auto-pick when exactly one exists
  async findActiveRegistrationsByParty(partyId: string): Promise<PartyTaxRegistration[]> {
    const rows = await this.db
      .select()
      .from(partyTaxRegistrations)
      .where(and(eq(partyTaxRegistrations.partyId, partyId), eq(partyTaxRegistrations.isActive, true)))
      .limit(2);
    return rows as PartyTaxRegistration[];
  }

  // Loads a bank account for pick validation
  async findBankAccountById(id: string): Promise<PartyBankAccount | undefined> {
    const [row] = await this.db.select().from(partyBankAccounts).where(eq(partyBankAccounts.id, id)).limit(1);
    return row as PartyBankAccount | undefined;
  }

  // Loads a relationship for order-contact pick validation
  async findRelationshipById(id: string): Promise<PartyRelationship | undefined> {
    const [row] = await this.db.select().from(partyRelationships).where(eq(partyRelationships.id, id)).limit(1);
    return row as PartyRelationship | undefined;
  }

  // Loads an enrollment joined with the owning supplier's party for pick validation
  async findByIdWithPartyId(id: string): Promise<(SupplierSite & { partyId: string | null }) | undefined> {
    const [row] = await this.db
      .select({ ...getTableColumns(supplierSites), partyId: suppliers.partyId })
      .from(supplierSites)
      .leftJoin(suppliers, eq(suppliers.id, supplierSites.supplierId))
      .where(eq(supplierSites.id, id))
      .limit(1);
    return row as (SupplierSite & { partyId: string | null }) | undefined;
  }

  // Loads an enrollment by supplier and site joined with the picked registration, bank account, and order contact
  async findBySupplierAndSite(supplierId: string, siteId: string): Promise<SupplierSiteWithPicks | undefined> {
    const [row] = await this.db
      .select({
        ...getTableColumns(supplierSites),
        registrationNumber: partyTaxRegistrations.registrationNumber,
        registrationType: partyTaxRegistrations.registrationType,
        bankAccountName: partyBankAccounts.accountName,
        bankName: partyBankAccounts.bankName,
        ...orderContactSelect,
      })
      .from(supplierSites)
      .leftJoin(partyTaxRegistrations, eq(partyTaxRegistrations.id, supplierSites.partyTaxRegistrationId))
      .leftJoin(partyBankAccounts, eq(partyBankAccounts.id, supplierSites.partyBankAccountId))
      .leftJoin(orderRel, eq(orderRel.id, supplierSites.orderRelationshipId))
      .leftJoin(orderParty, eq(orderParty.id, orderRel.childPartyId))
      .leftJoin(
        orderEmail,
        and(
          eq(orderEmail.partyId, orderRel.childPartyId),
          eq(orderEmail.channel, PartyCommunicationChannelValues.EMAIL),
          eq(orderEmail.isPrimary, true),
        ),
      )
      .leftJoin(
        orderPhone,
        and(
          eq(orderPhone.partyId, orderRel.childPartyId),
          eq(orderPhone.channel, PartyCommunicationChannelValues.PHONE),
          eq(orderPhone.isPrimary, true),
        ),
      )
      .where(and(eq(supplierSites.supplierId, supplierId), eq(supplierSites.siteId, siteId)))
      .limit(1);
    return row as SupplierSiteWithPicks | undefined;
  }

  // Loads the current site's enrollment of a supplier joined with the supplier's commercial identity
  async findSiteSupplier(supplierId: string, siteId: string): Promise<SiteSupplierRow | undefined> {
    const [row] = await this.db
      .select({
        ...getTableColumns(supplierSites),
        supplierName: parties.displayName,
        supplierCode: suppliers.code,
        currencyCode: suppliers.currencyCode,
        purchasingBlocked: suppliers.purchasingBlocked,
      })
      .from(supplierSites)
      .leftJoin(suppliers, eq(suppliers.id, supplierSites.supplierId))
      .leftJoin(parties, eq(parties.id, suppliers.partyId))
      .where(and(eq(supplierSites.supplierId, supplierId), eq(supplierSites.siteId, siteId)))
      .limit(1);
    return row as SiteSupplierRow | undefined;
  }

  // Returns true when the supplier has an active enrollment for the site
  async isEnrolled(supplierId: string, siteId: string): Promise<boolean> {
    return this.exists(
      and(
        eq(supplierSites.supplierId, supplierId),
        eq(supplierSites.siteId, siteId),
        eq(supplierSites.isActive, true),
      ) as SQL,
    );
  }
}
