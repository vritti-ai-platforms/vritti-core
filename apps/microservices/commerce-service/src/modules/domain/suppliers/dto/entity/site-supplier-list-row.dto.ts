import type { SiteSupplierListRow } from '../../repositories/suppliers.repository';

export const SiteEnrollmentStatusValues = {
  ENROLLED: 'ENROLLED' as const,
  NOT_ENROLLED: 'NOT_ENROLLED' as const,
};
export type SiteEnrollmentStatus = (typeof SiteEnrollmentStatusValues)[keyof typeof SiteEnrollmentStatusValues];

export class SiteSupplierListRowDto {
  id: string;
  partyId: string;
  partyName: string;
  code: string;
  currencyCode: string;
  purchasingBlocked: boolean;
  defaultPaymentTermId: string | null;
  enrollmentStatus: SiteEnrollmentStatus;
  enrollmentId: string | null;
  paymentTermId: string | null;
  paymentTermName: string | null;
  enrolledAt: string | null;

  static from(row: SiteSupplierListRow): SiteSupplierListRowDto {
    const dto = new SiteSupplierListRowDto();
    dto.id = row.id;
    dto.partyId = row.partyId;
    dto.partyName = row.partyName;
    dto.code = row.code;
    dto.currencyCode = row.currencyCode;
    dto.purchasingBlocked = row.purchasingBlocked;
    dto.defaultPaymentTermId = row.defaultPaymentTermId ?? null;
    dto.enrollmentStatus = row.enrollmentId
      ? SiteEnrollmentStatusValues.ENROLLED
      : SiteEnrollmentStatusValues.NOT_ENROLLED;
    dto.enrollmentId = row.enrollmentId ?? null;
    dto.paymentTermId = row.paymentTermId ?? null;
    dto.paymentTermName = row.paymentTermName ?? null;
    dto.enrolledAt = row.enrolledAt ? new Date(row.enrolledAt).toISOString() : null;
    return dto;
  }
}
