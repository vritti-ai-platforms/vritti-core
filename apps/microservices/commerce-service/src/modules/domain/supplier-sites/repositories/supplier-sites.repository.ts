import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, getColumns, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { alias } from '@vritti/api-sdk/drizzle-pg-core';
import {
  type PartyBankAccount,
  PartyCommunicationChannelValues,
  type PartyRelationship,
  type PartyTaxRegistration,
  type PaymentTerm,
  parties,
  partyBankAccounts,
  partyCommunications,
  partyRelationships,
  partyTaxRegistrations,
  paymentTerms,
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
  paymentTermName: string | null;
  registrationNumber: string | null;
  registrationType: TaxRegistrationType | null;
  bankAccountName: string | null;
  bankName: string | null;
  orderContactLabel: string | null;
  orderContactName: string | null;
  orderContactEmail: string | null;
  orderContactPhone: string | null;
};

@Injectable()
export class SupplierSitesDomainRepository extends PrimaryBaseRepository<typeof supplierSites> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierSites);
  }

  // Returns paginated enrollments of a supplier joined with the picked registration, bank account, and order contact
  // Returns every enrollment of a supplier joined with its payment term, registration, bank account, and order contact
  async findAllForSupplier(supplierId: string): Promise<SupplierSiteWithPicks[]> {
    const { result } = await this.findAllAndCount<SupplierSiteWithPicks>({
      select: {
        ...getColumns(supplierSites),
        paymentTermName: paymentTerms.name,
        registrationNumber: partyTaxRegistrations.registrationNumber,
        registrationType: partyTaxRegistrations.registrationType,
        bankAccountName: partyBankAccounts.accountName,
        bankName: partyBankAccounts.bankName,
        ...orderContactSelect,
      },
      leftJoins: [
        { table: paymentTerms, on: eq(paymentTerms.id, supplierSites.paymentTermId) },
        { table: partyTaxRegistrations, on: eq(partyTaxRegistrations.id, supplierSites.partyTaxRegistrationId) },
        { table: partyBankAccounts, on: eq(partyBankAccounts.id, supplierSites.partyBankAccountId) },
        ...orderContactJoins,
      ],
      where: eq(supplierSites.supplierId, supplierId),
      orderBy: [desc(supplierSites.createdAt)],
    });
    return result;
  }

  // Loads a supplier row for enrollment validation
  async findSupplier(supplierId: string): Promise<Supplier | undefined> {
    const [row] = await this.db.select().from(suppliers).where(eq(suppliers.id, supplierId)).limit(1);
    return row as Supplier | undefined;
  }

  // Loads a payment term for pick validation
  async findPaymentTermById(id: string): Promise<PaymentTerm | undefined> {
    const [row] = await this.db.select().from(paymentTerms).where(eq(paymentTerms.id, id)).limit(1);
    return row as PaymentTerm | undefined;
  }

  // Loads a tax registration for pick validation
  async findRegistrationById(id: string): Promise<PartyTaxRegistration | undefined> {
    const [row] = await this.db.select().from(partyTaxRegistrations).where(eq(partyTaxRegistrations.id, id)).limit(1);
    return row as PartyTaxRegistration | undefined;
  }

  async findBySupplierAndSite(supplierId: string, siteId: string): Promise<SupplierSite | undefined> {
    return this.model.findFirst({ where: { supplierId, siteId } }) as Promise<SupplierSite | undefined>;
  }

  // Returns true when the supplier is enrolled for the site
  async isEnrolled(supplierId: string, siteId: string): Promise<boolean> {
    return this.exists(and(eq(supplierSites.supplierId, supplierId), eq(supplierSites.siteId, siteId)) as SQL);
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
      .select({ ...getColumns(supplierSites), partyId: suppliers.partyId })
      .from(supplierSites)
      .innerJoin(suppliers, eq(suppliers.id, supplierSites.supplierId))
      .where(eq(supplierSites.id, id))
      .limit(1);
    return row as (SupplierSite & { partyId: string | null }) | undefined;
  }
}
