import type { PartyType } from '@/db/schema';
import type { SupplierEnrollmentRowRecord } from '../../repositories/supplier-enrollments.repository';

export const SupplierEnrollmentStatusValues = {
  ENROLLED: 'ENROLLED' as const,
  NOT_ENROLLED: 'NOT_ENROLLED' as const,
};
export type SupplierEnrollmentStatus =
  (typeof SupplierEnrollmentStatusValues)[keyof typeof SupplierEnrollmentStatusValues];

export class SupplierEnrollmentRowDto {
  id: string | null;
  supplierId: string;
  supplierCode: string;
  partyId: string;
  partyName: string;
  partyType: PartyType;
  siteId: string;
  siteName: string | null;
  siteCode: string | null;
  enrollmentStatus: SupplierEnrollmentStatus;
  // Active at the site: the enrollment's own flag and the supplier's at LE; null when not enrolled
  isActive: boolean | null;
  isSupplierActive: boolean;
  purchasingBlocked: boolean;
  paymentBlocked: boolean;
  currencyCode: string;
  defaultPaymentTermId: string;
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
  enrolledAt: string | null;

  // Maps a (supplier, site) row, enrolled or not, to the shared enrollment row; site names are filled by the gateway
  static from(row: SupplierEnrollmentRowRecord): SupplierEnrollmentRowDto {
    const dto = new SupplierEnrollmentRowDto();
    dto.id = row.id ?? null;
    dto.supplierId = row.supplierId;
    dto.supplierCode = row.supplierCode;
    dto.partyId = row.partyId;
    dto.partyName = row.partyName;
    dto.partyType = row.partyType;
    dto.siteId = row.siteId;
    dto.siteName = null;
    dto.siteCode = null;
    dto.enrollmentStatus = row.id
      ? SupplierEnrollmentStatusValues.ENROLLED
      : SupplierEnrollmentStatusValues.NOT_ENROLLED;
    dto.isActive = row.isActive == null ? null : row.isActive && row.isSupplierActive;
    dto.isSupplierActive = row.isSupplierActive;
    dto.purchasingBlocked = row.purchasingBlocked;
    dto.paymentBlocked = row.paymentBlocked;
    dto.currencyCode = row.currencyCode;
    dto.defaultPaymentTermId = row.defaultPaymentTermId;
    dto.paymentTermId = row.paymentTermId ?? null;
    dto.paymentTermName = row.paymentTermName ?? null;
    dto.partyTaxRegistrationId = row.partyTaxRegistrationId ?? null;
    dto.registrationNumber = row.registrationNumber ?? null;
    dto.registrationCountryCode = row.registrationCountryCode ?? null;
    dto.registrationJurisdictionName = row.registrationJurisdictionName ?? null;
    dto.partyBankAccountId = row.partyBankAccountId ?? null;
    dto.bankAccountName = row.bankAccountName ?? null;
    dto.orderRelationshipId = row.orderRelationshipId ?? null;
    dto.orderContactLabel = row.orderContactLabel ?? null;
    dto.orderContactName = row.orderContactName ?? null;
    dto.orderEmailCommunicationId = row.orderEmailCommunicationId ?? null;
    dto.orderEmail = row.orderEmail ?? null;
    dto.orderPhoneCommunicationId = row.orderPhoneCommunicationId ?? null;
    dto.orderPhone = row.orderPhone ?? null;
    dto.enrolledAt = row.enrolledAt ? new Date(row.enrolledAt).toISOString() : null;
    return dto;
  }
}
