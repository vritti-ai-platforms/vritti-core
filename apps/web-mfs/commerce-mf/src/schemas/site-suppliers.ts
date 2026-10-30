import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

export interface SiteSupplierRow {
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
}

export type SiteEnrollmentStatus = 'ENROLLED' | 'NOT_ENROLLED';

export const SITE_ENROLLMENT_STATUS_OPTIONS: { value: SiteEnrollmentStatus; label: string }[] = [
  { value: 'ENROLLED', label: 'Enrolled' },
  { value: 'NOT_ENROLLED', label: 'Not Enrolled' },
];

// A row of the site's suppliers list: every supplier of the legal entity with its enrollment status
export interface SiteSupplierListRow {
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
}

export type SiteSuppliersTableResponse = TableResponse<SiteSupplierListRow>;

export interface SupplierAtSiteData extends SiteSupplierRow {
  siteId?: string;
  siteName?: string | null;
  siteCode?: string | null;
}

export const enrollSiteSupplierSchema = z.object({
  supplierId: z.uuid('Supplier is required'),
  paymentTermId: z.uuid('Payment term is required'),
  partyTaxRegistrationId: z.uuid('Tax registration is required'),
  partyBankAccountId: z.uuid().optional(),
  orderRelationshipId: z.uuid().optional(),
});

export const updateSiteEnrollmentSchema = z.object({
  paymentTermId: z.uuid('Payment term is required'),
  partyTaxRegistrationId: z.uuid('Tax registration is required'),
  partyBankAccountId: z.uuid().nullable().optional(),
  orderRelationshipId: z.uuid().nullable().optional(),
});

export type EnrollSiteSupplierFormData = z.infer<typeof enrollSiteSupplierSchema>;
export type UpdateSiteEnrollmentFormData = z.infer<typeof updateSiteEnrollmentSchema>;
