import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCodeField, zodNumericField, zodResolver } from '@vritti/quantum-ui/zod';
import type { Resolver } from 'react-hook-form';

export const PAYMENT_TERM_BASELINES = ['INVOICE_DATE', 'GOODS_RECEIPT_DATE', 'END_OF_MONTH'] as const;
export type PaymentTermBaseline = (typeof PAYMENT_TERM_BASELINES)[number];

export const PAYMENT_TERM_BASELINE_LABELS: Record<PaymentTermBaseline, string> = {
  INVOICE_DATE: 'Invoice date',
  GOODS_RECEIPT_DATE: 'Goods receipt date',
  END_OF_MONTH: 'End of invoice month',
};

export const PAYMENT_TERM_BASELINE_OPTIONS = PAYMENT_TERM_BASELINES.map((value) => ({
  value,
  label: PAYMENT_TERM_BASELINE_LABELS[value],
}));

export type PaymentTermStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

export const PAYMENT_TERM_STATUS_LABELS: Record<PaymentTermStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

export const createPaymentTermSchema = z.object({
  code: zodCodeField({ max: 50 }),
  name: z.string({ error: 'Name is required' }).min(1, 'Name is required').max(255),
  baseline: z.enum(PAYMENT_TERM_BASELINES, { error: 'Baseline is required' }),
  description: z.string().max(500),
});

export type CreatePaymentTermFormData = z.infer<typeof createPaymentTermSchema>;

export const editPaymentTermFormSchema = createPaymentTermSchema.extend({ code: z.string() });
export type EditPaymentTermFormData = z.infer<typeof editPaymentTermFormSchema>;

const paymentTermRuleSchema = z
  .object({
    percent: zodNumericField({ required: 'Share is required', min: 0.01, max: 100, positive: true }),
    dueDays: zodNumericField({ required: 'Due days are required', min: 0, integer: true }),
    discountPercent: zodNumericField({ nullable: true, min: 0.01, max: 99.99 }),
    discountDays: zodNumericField({ nullable: true, min: 0, integer: true }),
  })
  .superRefine((rule, ctx) => {
    const hasPercent = rule.discountPercent != null;
    const hasDays = rule.discountDays != null;
    if (hasPercent && !hasDays) {
      ctx.addIssue({ code: 'custom', path: ['discountDays'], message: 'Required with a discount' });
    }
    if (hasDays && !hasPercent) {
      ctx.addIssue({ code: 'custom', path: ['discountPercent'], message: 'Required with a discount window' });
    }
    if (rule.discountDays != null && rule.discountDays > rule.dueDays) {
      ctx.addIssue({ code: 'custom', path: ['discountDays'], message: 'Must not exceed the due days' });
    }
  });

export interface PaymentTermRuleFormData {
  percent: number;
  dueDays: number;
  discountPercent: number | null;
  discountDays: number | null;
}

export const paymentTermRuleResolver = zodResolver(
  paymentTermRuleSchema,
) as unknown as Resolver<PaymentTermRuleFormData>;

export interface PaymentTermRuleData extends PaymentTermRuleFormData {
  id: string;
  sortOrder: number;
}

export interface PaymentTermData {
  id: string;
  code: string;
  name: string;
  baseline: PaymentTermBaseline;
  description: string | null;
  status: PaymentTermStatus;
  summary: string | null;
  totalPercent: number;
  lines: PaymentTermRuleData[];
  createdAt: string;
  updatedAt: string;
}

export type PaymentTermsTableResponse = TableResponse<PaymentTermData>;

export interface CreatePaymentTermPayload {
  code: string;
  name: string;
  baseline: PaymentTermBaseline;
  description: string | null;
}

export type UpdatePaymentTermPayload = Partial<Omit<CreatePaymentTermPayload, 'code'>>;
