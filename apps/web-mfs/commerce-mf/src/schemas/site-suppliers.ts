import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

// A site's view of an enrolled supplier: supplier fields + this site's enrollment picks.
export interface SiteSupplierRow {
  id: string;
  partyId: string;
  partyName: string;
  code: string;
  currencyCode: string;
  paymentTerms: string | null;
  leadTimeDays: number | null;
  purchasingBlocked: boolean;
  paymentBlocked: boolean;
  orderEmail: string | null;
  orderPhone: string | null;
  isActive: boolean;
  enrollmentId: string;
  partyTaxRegistrationId: string | null;
  registrationNumber: string | null;
  partyBankAccountId: string | null;
  bankAccountName: string | null;
  enrollmentActive: boolean;
  enrolledAt: string;
}

export type SiteSuppliersTableResponse = TableResponse<SiteSupplierRow>;

export const enrollSiteSupplierSchema = z.object({
  supplierId: z.uuid('Supplier is required'),
});

export const updateSiteEnrollmentSchema = z.object({
  partyTaxRegistrationId: z.string().nullable().optional(),
  partyBankAccountId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type EnrollSiteSupplierFormData = z.infer<typeof enrollSiteSupplierSchema>;
export type UpdateSiteEnrollmentFormData = z.infer<typeof updateSiteEnrollmentSchema>;
