import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import Decimal from '@vritti/quantum-ui/decimal';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCurrencyField, zodNumericField } from '@vritti/quantum-ui/zod';
import type { IdentifierType } from './party-identifiers';
import { type PurchaseType, PurchaseTypeValues } from './purchases';
import type { RegistrationType } from './tax-registrations';

// The enrollment's own active flag (null when not enrolled), and the supplier's active flag and blocks
export interface EnrollmentFlags {
  isActive: boolean | null;
  isSupplierActive: boolean;
  purchasingBlocked: boolean;
  paymentBlocked: boolean;
}

export type SupplierEnrollmentStatus = 'ENROLLED' | 'NOT_ENROLLED';

export const SUPPLIER_ENROLLMENT_STATUS_OPTIONS: { value: SupplierEnrollmentStatus; label: string }[] = [
  { value: 'ENROLLED', label: 'Enrolled' },
  { value: 'NOT_ENROLLED', label: 'Not Enrolled' },
];

export interface SupplierEnrollmentKey {
  supplierId: string;
  siteId: string;
}

// The picks of an enrollment: a payment term and ordering email and phone always, the rest optional
export interface SupplierEnrollmentPicks {
  paymentTermId: string;
  partyTaxRegistrationId: string | null;
  partyBankAccountId: string | null;
  orderRelationshipId: string | null;
  orderEmailCommunicationId: string;
  orderPhoneCommunicationId: string;
}

// One enrollment with its picks resolved; payment term and ordering email and phone are always set
// What enrolling a supplier returns
export interface CreatedSupplierEnrollment {
  id: string;
}

export interface SupplierEnrollment extends SupplierEnrollmentKey {
  id: string;
  paymentTermId: string;
  paymentTermName: string;
  partyTaxRegistrationId: string | null;
  partyBankAccountId: string | null;
  registrationNumber: string | null;
  registrationType: RegistrationType | null;
  bankAccountName: string | null;
  bankName: string | null;
  orderRelationshipId: string | null;
  orderContactLabel: string | null;
  orderContactName: string | null;
  orderContactEmail: string | null;
  orderContactPhone: string | null;
  orderEmailCommunicationId: string;
  orderPhoneCommunicationId: string;
  orderEmail: string;
  orderPhone: string;
  // Active at the site: the enrollment's own flag and the supplier's at LE
  isActive: boolean;
  isSupplierActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// The supplier's side of a (supplier, site) pair, set whether or not the supplier is enrolled at the site
interface SupplierEnrollmentRowBase extends SupplierEnrollmentKey {
  supplierCode: string;
  partyId: string;
  partyName: string;
  partyType: 'COMPANY' | 'PERSON';
  siteName: string;
  siteCode: string;
  currencyCode: string;
  currencyCodes: string[];
  defaultPaymentTermId: string;
  isSupplierActive: boolean;
  purchasingBlocked: boolean;
  paymentBlocked: boolean;
}

// A pair with an enrollment; `id` is the enrollment
export interface EnrolledSupplierEnrollmentRow extends SupplierEnrollmentRowBase, SupplierEnrollmentPicks {
  enrollmentStatus: 'ENROLLED';
  id: string;
  // Active at the site: the enrollment's own flag and the supplier's at LE
  isActive: boolean;
  paymentTermName: string;
  registrationNumber: string | null;
  bankAccountName: string | null;
  orderContactLabel: string | null;
  orderContactName: string | null;
  orderEmail: string;
  orderPhone: string;
  enrolledAt: string;
}

// A pair without an enrollment; every enrollment field is null
export interface NotEnrolledSupplierEnrollmentRow extends SupplierEnrollmentRowBase {
  enrollmentStatus: 'NOT_ENROLLED';
  id: null;
  isActive: null;
  paymentTermId: null;
  paymentTermName: null;
  partyTaxRegistrationId: null;
  registrationNumber: null;
  partyBankAccountId: null;
  bankAccountName: null;
  orderRelationshipId: null;
  orderContactLabel: null;
  orderContactName: null;
  orderEmailCommunicationId: null;
  orderEmail: null;
  orderPhoneCommunicationId: null;
  orderPhone: null;
  enrolledAt: null;
}

// A (supplier, site) pair of the legal entity, narrowed by `enrollmentStatus`
export type SupplierEnrollmentRow = EnrolledSupplierEnrollmentRow | NotEnrolledSupplierEnrollmentRow;

export type SupplierEnrollmentsTableResponse = TableResponse<SupplierEnrollmentRow>;

// A supplier as one site sees it, enrolled there or not
export type SupplierEnrollmentDetail = SupplierEnrollmentRow & {
  partyTaxId: string | null;
  partyTaxIdType: IdentifierType | null;
};

// How many rows each tab of a supplier's page at one site lists: the items the site lists, the quotations at the site
// and the supplier's invoices there
export interface SupplierEnrollmentCounts {
  siteItemCount: number;
  quotationCount: number;
  invoiceCount: number;
}

// The supplier's party facts an enrollment form needs, whichever workspace resolves them
export interface SupplierParty {
  partyId: string;
  partyTaxId: string | null;
  partyTaxIdType: IdentifierType | null;
  defaultPaymentTermId: string;
}

// The enrollment's order email and phone: the supplier's communications tagged Ordering
const orderCommunicationFields = {
  orderEmailCommunicationId: z.uuid('Order email is required'),
  orderPhoneCommunicationId: z.uuid('Order phone is required'),
};

const enrollmentFields = {
  paymentTermId: z.uuid('Payment term is required'),
  partyTaxRegistrationId: z.uuid().nullable().optional(),
  partyBankAccountId: z.uuid().nullable().optional(),
  orderRelationshipId: z.uuid().nullable().optional(),
  ...orderCommunicationFields,
};

export const createSupplierEnrollmentSchema = z.object({
  supplierId: z.uuid('Supplier is required'),
  siteId: z.uuid('Site is required'),
  ...enrollmentFields,
  isActive: z.boolean(),
});

export const updateSupplierEnrollmentSchema = z.object(enrollmentFields);

export type CreateSupplierEnrollmentFormData = z.infer<typeof createSupplierEnrollmentSchema>;
export type UpdateSupplierEnrollmentFormData = z.infer<typeof updateSupplierEnrollmentSchema>;

export interface CreateSupplierEnrollmentPayload extends SupplierEnrollmentKey {
  paymentTermId: string;
  partyTaxRegistrationId?: string;
  partyBankAccountId?: string;
  orderRelationshipId?: string;
  orderEmailCommunicationId: string;
  orderPhoneCommunicationId: string;
  isActive: boolean;
}

export interface UpdateSupplierEnrollmentPayload {
  paymentTermId?: string;
  partyTaxRegistrationId?: string | null;
  partyBankAccountId?: string | null;
  orderRelationshipId?: string | null;
  orderEmailCommunicationId?: string;
  orderPhoneCommunicationId?: string;
}

export interface UpdateSupplierEnrollmentVars extends SupplierEnrollmentKey {
  data: UpdateSupplierEnrollmentPayload;
}

export interface SetSupplierEnrollmentActiveVars extends SupplierEnrollmentKey {
  isActive: boolean;
}

export interface EnrollmentPurchasing {
  purchaseType: PurchaseType;
  approvalEnabled: boolean;
  approverUserIds: string[];
  approverNames: string[];
  approvalThreshold: CurrencyValue;
  qualityCheckEnabled: boolean;
  quarantineLocationId: string | null;
  quarantineLocationName: string | null;
  defaultReceiptLocationId: string | null;
  defaultReceiptLocationName: string | null;
  priceTolerancePct: number;
  qtyTolerancePct: number;
  amountTolerance: CurrencyValue;
}

export type LeSupplierEnrollmentDetail = SupplierEnrollmentDetail & { purchasing: EnrollmentPurchasing | null };

export type UpdateEnrollmentPurchasingPayload = Omit<
  EnrollmentPurchasing,
  'approverNames' | 'quarantineLocationName' | 'defaultReceiptLocationName'
>;

export interface UpdateEnrollmentPurchasingVars extends SupplierEnrollmentKey {
  data: UpdateEnrollmentPurchasingPayload;
}

// A tolerance percentage — zero or more
function tolerancePctField(label: string) {
  return zodNumericField({ required: `${label} tolerance is required`, min: 0, minMessage: 'Cannot be negative' });
}

export const enrollmentPurchasingSchema = z
  .object({
    purchaseType: z.enum(PurchaseTypeValues, { error: 'Purchase type is required' }),
    approvalEnabled: z.boolean(),
    approverUserIds: z.array(z.uuid()),
    approvalThreshold: zodCurrencyField({ optional: true }),
    qualityCheckEnabled: z.boolean(),
    quarantineLocationId: z.uuid().optional(),
    defaultReceiptLocationId: z.uuid().optional(),
    priceTolerancePct: tolerancePctField('Price'),
    qtyTolerancePct: tolerancePctField('Quantity'),
    amountTolerance: z
      .object({ currency: z.string(), value: z.string() }, { error: 'Amount tolerance is required' })
      .refine((amount) => amount.value !== '', 'Amount tolerance is required')
      .refine((amount) => amount.value === '' || !new Decimal(amount.value).isNegative(), 'Cannot be negative'),
  })
  .superRefine((data, ctx) => {
    if (data.approvalEnabled && data.approverUserIds.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['approverUserIds'], message: 'Pick at least one approver' });
    }
    if (data.qualityCheckEnabled && !data.quarantineLocationId) {
      ctx.addIssue({ code: 'custom', path: ['quarantineLocationId'], message: 'Quarantine location is required' });
    }
  });

export type EnrollmentPurchasingFormData = z.infer<typeof enrollmentPurchasingSchema>;
