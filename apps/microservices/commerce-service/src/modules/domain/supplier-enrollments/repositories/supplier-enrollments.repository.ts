import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, getColumns, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { alias } from '@vritti/api-sdk/drizzle-pg-core';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import {
  type PartyCommunicationChannel,
  PartyCommunicationChannelValues,
  PartyFunctionTypeValues,
  type PartyIdentifierType,
  type PartyType,
  parties,
  partyBankAccounts,
  partyCommunications,
  partyFunctions,
  partyRelationships,
  partyTaxRegistrations,
  paymentTerms,
  type Supplier,
  type SupplierEnrollment,
  supplierEnrollments,
  supplierItems,
  suppliers,
  type TaxRegistrationType,
  TaxRegistrationTypeValues,
  taxJurisdictions,
} from '@/db/schema';

export const orderRel = alias(partyRelationships, 'order_rel');
export const orderParty = alias(parties, 'order_party');
const orderContactEmail = alias(partyCommunications, 'order_contact_email');
const orderContactPhone = alias(partyCommunications, 'order_contact_phone');
export const orderEmail = alias(partyCommunications, 'order_email');
export const orderPhone = alias(partyCommunications, 'order_phone');

const orderContactJoins = [
  { table: orderRel, on: eq(orderRel.id, supplierEnrollments.orderRelationshipId) },
  { table: orderParty, on: eq(orderParty.id, orderRel.childPartyId) },
  {
    table: orderContactEmail,
    on: and(
      eq(orderContactEmail.partyId, orderRel.childPartyId),
      eq(orderContactEmail.channel, PartyCommunicationChannelValues.EMAIL),
      eq(orderContactEmail.isPrimary, true),
    ),
  },
  {
    table: orderContactPhone,
    on: and(
      eq(orderContactPhone.partyId, orderRel.childPartyId),
      eq(orderContactPhone.channel, PartyCommunicationChannelValues.PHONE),
      eq(orderContactPhone.isPrimary, true),
    ),
  },
];

// The ordering email and phone every enrollment requires
const orderCommunicationJoins = [
  { table: orderEmail, on: eq(orderEmail.id, supplierEnrollments.orderEmailCommunicationId) },
  { table: orderPhone, on: eq(orderPhone.id, supplierEnrollments.orderPhoneCommunicationId) },
];

const orderContactSelect = {
  orderContactLabel: orderRel.jobTitle,
  orderContactName: orderParty.displayName,
  orderContactEmail: orderContactEmail.value,
  orderContactPhone: orderContactPhone.value,
  orderEmail: orderEmail.value,
  orderPhone: orderPhone.value,
};

const ORDER_COMMUNICATION_FIELDS = {
  [PartyCommunicationChannelValues.EMAIL]: {
    field: 'orderEmailCommunicationId',
    label: 'Invalid Order Email',
    noun: 'email address',
  },
  [PartyCommunicationChannelValues.PHONE]: {
    field: 'orderPhoneCommunicationId',
    label: 'Invalid Order Phone',
    noun: 'phone number',
  },
} as const;

const ENROLLMENT_REGISTRATION_TYPES: TaxRegistrationType[] = [
  TaxRegistrationTypeValues.GSTIN,
  TaxRegistrationTypeValues.VAT,
];

export type SupplierEnrollmentRowRecord = {
  id: string | null;
  supplierId: string;
  supplierCode: string;
  partyId: string;
  partyName: string;
  partyType: PartyType;
  currencyCode: string;
  defaultPaymentTermId: string;
  isActive: boolean | null;
  isSupplierActive: boolean;
  purchasingBlocked: boolean;
  paymentBlocked: boolean;
  paymentTermId: string | null;
  paymentTermName: string | null;
  partyTaxRegistrationId: string | null;
  registrationNumber: string | null;
  registrationCountryCode: string | null;
  registrationJurisdictionName: string | null;
  partyBankAccountId: string | null;
  bankAccountName: string | null;
  orderRelationshipId: string | null;
  orderContactLabel: string | null;
  orderContactName: string | null;
  orderEmailCommunicationId: string | null;
  orderEmail: string | null;
  orderPhoneCommunicationId: string | null;
  orderPhone: string | null;
  enrolledAt: Date | null;
};

export type SupplierEnrollmentDetailRecord = SupplierEnrollmentRowRecord & {
  partyTaxId: string | null;
  partyTaxIdType: PartyIdentifierType | null;
};

export type SupplierEnrollmentWithPicks = SupplierEnrollment & {
  paymentTermName: string;
  registrationNumber: string | null;
  registrationType: TaxRegistrationType | null;
  registrationCountryCode: string | null;
  registrationJurisdictionName: string | null;
  bankAccountName: string | null;
  bankName: string | null;
  orderContactLabel: string | null;
  orderContactName: string | null;
  orderContactEmail: string | null;
  orderContactPhone: string | null;
  orderEmail: string;
  orderPhone: string;
};

export interface SupplierEnrollmentPicks {
  paymentTermId?: string;
  partyTaxRegistrationId?: string | null;
  partyBankAccountId?: string | null;
  orderRelationshipId?: string | null;
  orderEmailCommunicationId?: string;
  orderPhoneCommunicationId?: string;
}

@Injectable()
export class SupplierEnrollmentsDomainRepository extends PrimaryBaseRepository<typeof supplierEnrollments> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierEnrollments);
  }

  // Returns enrollments joined with their payment term, registration, bank account, order contact and order email/phone
  private findWithPicks(where: SQL, limit?: number): Promise<{ result: SupplierEnrollmentWithPicks[]; count: number }> {
    return this.findAllAndCount<SupplierEnrollmentWithPicks>({
      select: {
        ...getColumns(supplierEnrollments),
        paymentTermName: paymentTerms.name,
        registrationNumber: partyTaxRegistrations.registrationNumber,
        registrationType: partyTaxRegistrations.registrationType,
        registrationCountryCode: partyTaxRegistrations.countryCode,
        registrationJurisdictionName: taxJurisdictions.name,
        bankAccountName: partyBankAccounts.accountName,
        bankName: partyBankAccounts.bankName,
        ...orderContactSelect,
      },
      innerJoins: [
        { table: paymentTerms, on: eq(paymentTerms.id, supplierEnrollments.paymentTermId) },
        ...orderCommunicationJoins,
      ],
      leftJoins: [
        {
          table: partyTaxRegistrations,
          on: eq(partyTaxRegistrations.id, supplierEnrollments.partyTaxRegistrationId),
        },
        { table: taxJurisdictions, on: eq(taxJurisdictions.id, partyTaxRegistrations.jurisdictionId) },
        { table: partyBankAccounts, on: eq(partyBankAccounts.id, supplierEnrollments.partyBankAccountId) },
        ...orderContactJoins,
      ],
      where,
      orderBy: [desc(supplierEnrollments.createdAt)],
      limit,
    });
  }

  // Returns every enrollment of a supplier joined with its picks
  async findAllForSupplier(supplierId: string): Promise<SupplierEnrollmentWithPicks[]> {
    const { result } = await this.findWithPicks(eq(supplierEnrollments.supplierId, supplierId));
    return result;
  }

  // Loads one enrollment joined with its picks
  async findByIdWithPicksOrThrow(id: string): Promise<SupplierEnrollmentWithPicks> {
    const { result } = await this.findWithPicks(eq(supplierEnrollments.id, id), 1);
    if (!result[0]) throw new NotFoundException('Enrollment not found.');
    return result[0];
  }

  // Loads a supplier row for enrollment validation, throwing when it does not exist
  async findSupplierOrThrow(supplierId: string): Promise<Supplier> {
    const [row] = await this.db.select().from(suppliers).where(eq(suppliers.id, supplierId)).limit(1);
    if (!row) throw new NotFoundException('Supplier not found.');
    return row as Supplier;
  }

  // Loads the supplier's enrollment at a site
  async findBySupplierAndSite(supplierId: string, siteId: string): Promise<SupplierEnrollment | undefined> {
    return this.model.findFirst({ where: { supplierId, siteId } }) as Promise<SupplierEnrollment | undefined>;
  }

  // Loads the supplier's enrollment at a site, throwing when the supplier is not enrolled there
  async findBySupplierAndSiteOrThrow(supplierId: string, siteId: string): Promise<SupplierEnrollment> {
    const enrollment = await this.findBySupplierAndSite(supplierId, siteId);
    if (!enrollment) throw new NotFoundException('Supplier is not enrolled for this site.');
    return enrollment;
  }

  // Rejects buying from a supplier that is not enrolled, not active or purchasing-blocked at the site
  async assertPurchasable(supplierId: string, siteId: string): Promise<void> {
    const enrollment = await this.findBySupplierAndSite(supplierId, siteId);
    if (!enrollment) {
      throw new BadRequestException({
        label: 'Not Enrolled',
        detail: 'This supplier is not enrolled for this site. Enroll it here before creating this document.',
      });
    }
    if (!enrollment.isSupplierActive || !enrollment.isActive) {
      throw new BadRequestException({
        label: 'Supplier Inactive',
        detail: enrollment.isSupplierActive
          ? "This supplier's enrollment at this site is inactive. Activate it at this site before purchasing."
          : 'This supplier is inactive. Activate the supplier before purchasing from it.',
      });
    }
    if ((await this.findSupplierOrThrow(supplierId)).purchasingBlocked) {
      throw new BadRequestException({
        label: 'Supplier Blocked',
        detail: 'Purchasing is blocked for this supplier. Lift the block on the supplier before purchasing from it.',
      });
    }
  }

  // Rejects any of the given picks that does not belong to the supplier's party or is unusable
  async assertPicksUsable(partyId: string, picks: SupplierEnrollmentPicks): Promise<void> {
    if (picks.paymentTermId) await this.assertPaymentTermUsable(picks.paymentTermId);
    if (picks.partyTaxRegistrationId) await this.assertRegistrationUsable(picks.partyTaxRegistrationId, partyId);
    if (picks.partyBankAccountId) await this.assertBankAccountBelongsToParty(picks.partyBankAccountId, partyId);
    if (picks.orderRelationshipId) {
      await this.assertOrderRelationshipBelongsToParty(picks.orderRelationshipId, partyId);
    }
    if (picks.orderEmailCommunicationId) {
      await this.assertOrderCommunicationUsable(
        picks.orderEmailCommunicationId,
        partyId,
        PartyCommunicationChannelValues.EMAIL,
      );
    }
    if (picks.orderPhoneCommunicationId) {
      await this.assertOrderCommunicationUsable(
        picks.orderPhoneCommunicationId,
        partyId,
        PartyCommunicationChannelValues.PHONE,
      );
    }
  }

  // Rejects an order email or phone that is not an active ORDERING communication of the supplier's party on that channel
  async assertOrderCommunicationUsable(
    communicationId: string,
    partyId: string,
    channel: PartyCommunicationChannel,
  ): Promise<void> {
    const target = ORDER_COMMUNICATION_FIELDS[channel as keyof typeof ORDER_COMMUNICATION_FIELDS];
    const [row] = await this.db
      .select({
        partyId: partyCommunications.partyId,
        channel: partyCommunications.channel,
        isActive: partyCommunications.isActive,
        isOrdering: sql<boolean>`EXISTS (
          SELECT 1 FROM ${partyFunctions}
          WHERE ${partyFunctions.partyCommunicationId} = ${partyCommunications.id}
            AND ${partyFunctions.function} = ${PartyFunctionTypeValues.ORDERING}
        )`,
      })
      .from(partyCommunications)
      .where(eq(partyCommunications.id, communicationId))
      .limit(1);

    const failure =
      !row || row.partyId !== partyId
        ? {
            detail: `The selected ${target.noun} does not belong to this supplier.`,
            message: 'Not a contact of this supplier',
          }
        : row.channel !== channel
          ? { detail: `The selected value is not an ${target.noun}.`, message: `Not an ${target.noun}` }
          : !row.isActive
            ? {
                detail: `The selected ${target.noun} is inactive. Pick an active one.`,
                message: `Inactive ${target.noun}`,
              }
            : !row.isOrdering
              ? {
                  detail: `The selected ${target.noun} is not marked for ordering on the supplier.`,
                  message: 'Not marked for ordering',
                }
              : undefined;
    if (!failure) return;
    throw new BadRequestException({
      label: target.label,
      detail: failure.detail,
      errors: [{ field: target.field, message: failure.message }],
    });
  }

  // Rejects payment-term picks that do not exist or are still drafts
  async assertPaymentTermUsable(paymentTermId: string): Promise<void> {
    const [term] = await this.db
      .select({ isPublished: paymentTerms.isPublished })
      .from(paymentTerms)
      .where(eq(paymentTerms.id, paymentTermId))
      .limit(1);
    if (term?.isPublished) return;
    throw new BadRequestException({
      label: 'Invalid Payment Term',
      detail: term
        ? 'The selected payment term is a draft. Pick a published payment term.'
        : 'The selected payment term does not exist.',
      errors: [{ field: 'paymentTermId', message: term ? 'Payment term is not published' : 'Payment term not found' }],
    });
  }

  // Rejects a registration pick that is not an active GSTIN or VAT registration of the supplier's party
  async assertRegistrationUsable(registrationId: string, partyId: string): Promise<void> {
    const [registration] = await this.db
      .select({
        partyId: partyTaxRegistrations.partyId,
        isActive: partyTaxRegistrations.isActive,
        registrationType: partyTaxRegistrations.registrationType,
      })
      .from(partyTaxRegistrations)
      .where(eq(partyTaxRegistrations.id, registrationId))
      .limit(1);
    const failure =
      !registration || registration.partyId !== partyId
        ? {
            label: 'Invalid Registration',
            detail: 'The selected tax registration does not belong to this supplier.',
            message: 'Not a registration of this supplier',
          }
        : !ENROLLMENT_REGISTRATION_TYPES.includes(registration.registrationType)
          ? {
              label: 'Invalid Registration',
              detail: 'Only a GSTIN or VAT registration can be picked for a site enrollment.',
              message: 'Not a GSTIN or VAT registration',
            }
          : !registration.isActive
            ? {
                label: 'Inactive Registration',
                detail: 'The selected tax registration is inactive. Pick an active registration of this supplier.',
                message: 'Registration is inactive',
              }
            : undefined;
    if (!failure) return;
    throw new BadRequestException({
      label: failure.label,
      detail: failure.detail,
      errors: [{ field: 'partyTaxRegistrationId', message: failure.message }],
    });
  }

  // Rejects bank account picks that belong to a different party than the supplier's
  async assertBankAccountBelongsToParty(bankAccountId: string, partyId: string): Promise<void> {
    const owned = await this.db
      .select({ one: sql<number>`1` })
      .from(partyBankAccounts)
      .where(and(eq(partyBankAccounts.id, bankAccountId), eq(partyBankAccounts.partyId, partyId)))
      .limit(1);
    if (owned.length > 0) return;
    throw new BadRequestException({
      label: 'Invalid Bank Account',
      detail: 'The selected bank account does not belong to this supplier.',
      errors: [{ field: 'partyBankAccountId', message: 'Not an account of this supplier' }],
    });
  }

  // Rejects order-contact picks that are not a relationship of this party or do not hold the ORDER function
  async assertOrderRelationshipBelongsToParty(relationshipId: string, partyId: string): Promise<void> {
    const [relationship] = await this.db
      .select({
        parentPartyId: partyRelationships.parentPartyId,
        hasOrderFunction: sql<boolean>`EXISTS (
          SELECT 1 FROM ${partyFunctions}
          WHERE ${partyFunctions.partyRelationshipId} = ${partyRelationships.id}
            AND ${partyFunctions.function} = ${PartyFunctionTypeValues.ORDER}
        )`,
      })
      .from(partyRelationships)
      .where(eq(partyRelationships.id, relationshipId))
      .limit(1);
    if (!relationship || relationship.parentPartyId !== partyId) {
      throw new BadRequestException({
        label: 'Invalid Order Contact',
        detail: 'The selected order contact does not belong to this supplier.',
        errors: [{ field: 'orderRelationshipId', message: 'Not a contact of this supplier' }],
      });
    }
    if (!relationship.hasOrderFunction) {
      throw new BadRequestException({
        label: 'Invalid Order Contact',
        detail: 'The selected contact is not marked as an order contact.',
        errors: [{ field: 'orderRelationshipId', message: 'Not an order contact' }],
      });
    }
  }

  // Throws when the supplier is already enrolled for the site
  async assertNotEnrolled(supplierId: string, siteId: string): Promise<void> {
    if (await this.isEnrolled(supplierId, siteId)) {
      throw new ConflictException('Supplier is already enrolled for this site.');
    }
  }

  // Returns true when the supplier is enrolled for the site
  async isEnrolled(supplierId: string, siteId: string): Promise<boolean> {
    return this.exists(
      and(eq(supplierEnrollments.supplierId, supplierId), eq(supplierEnrollments.siteId, siteId)) as SQL,
    );
  }

  // Returns the sites a supplier, or any supplier of an inventory item, is enrolled at; with isActive only those where the
  // enrollment and the supplier are both active
  async findEnrolledSiteIds(
    owner: { supplierId?: string; inventoryItemId?: string },
    isActive?: boolean,
  ): Promise<string[]> {
    const ofOwner = owner.supplierId
      ? eq(supplierEnrollments.supplierId, owner.supplierId)
      : inArray(
          supplierEnrollments.supplierId,
          this.db
            .select({ supplierId: supplierItems.supplierId })
            .from(supplierItems)
            .where(eq(supplierItems.inventoryItemId, owner.inventoryItemId as string)),
        );
    const active = isActive
      ? and(eq(supplierEnrollments.isActive, true), eq(supplierEnrollments.isSupplierActive, true))
      : undefined;
    const rows = await this.db
      .selectDistinct({ siteId: supplierEnrollments.siteId })
      .from(supplierEnrollments)
      .where(and(ofOwner, active));
    return rows.map((row) => row.siteId);
  }
}
