import type { SupplierAtSiteRow } from '../../repositories/suppliers.repository';
import { type SiteEnrollmentStatus, SiteEnrollmentStatusValues } from './site-supplier-list-row.dto';

export class SupplierAtSiteDto {
  id: string;
  partyId: string;
  partyName: string;
  code: string;
  currencyCode: string;
  purchasingBlocked: boolean;
  paymentBlocked: boolean;
  orderEmail: string | null;
  orderPhone: string | null;
  isActive: boolean;
  defaultPaymentTermId: string | null;
  enrollmentStatus: SiteEnrollmentStatus;
  enrollmentId: string | null;
  paymentTermId: string | null;
  paymentTermName: string | null;
  partyTaxRegistrationId: string | null;
  registrationNumber: string | null;
  partyBankAccountId: string | null;
  bankAccountName: string | null;
  orderRelationshipId: string | null;
  enrolledAt: string | null;

  static from(row: SupplierAtSiteRow): SupplierAtSiteDto {
    const dto = new SupplierAtSiteDto();
    dto.id = row.id;
    dto.partyId = row.partyId;
    dto.partyName = row.partyName;
    dto.code = row.code;
    dto.currencyCode = row.currencyCode;
    dto.purchasingBlocked = row.purchasingBlocked;
    dto.paymentBlocked = row.paymentBlocked;
    dto.orderEmail = row.orderEmail ?? null;
    dto.orderPhone = row.orderPhone ?? null;
    dto.isActive = row.isActive;
    dto.defaultPaymentTermId = row.defaultPaymentTermId ?? null;
    dto.enrollmentStatus = row.enrollmentId
      ? SiteEnrollmentStatusValues.ENROLLED
      : SiteEnrollmentStatusValues.NOT_ENROLLED;
    dto.enrollmentId = row.enrollmentId ?? null;
    dto.paymentTermId = row.paymentTermId ?? null;
    dto.paymentTermName = row.paymentTermName ?? null;
    dto.partyTaxRegistrationId = row.partyTaxRegistrationId ?? null;
    dto.registrationNumber = row.registrationNumber ?? null;
    dto.partyBankAccountId = row.partyBankAccountId ?? null;
    dto.bankAccountName = row.bankAccountName ?? null;
    dto.orderRelationshipId = row.orderRelationshipId ?? null;
    dto.enrolledAt = row.enrolledAt ? new Date(row.enrolledAt).toISOString() : null;
    return dto;
  }
}
