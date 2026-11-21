import Decimal from '@vritti/quantum-ui/decimal';
import type { CurrencyAmount } from '@vritti/quantum-ui/format';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodNumericField, zodResolver } from '@vritti/quantum-ui/zod';
import type { Resolver } from 'react-hook-form';

export const PAYMENT_TERM_BASELINES = ['INVOICE_DATE', 'GOODS_RECEIPT_DATE', 'END_OF_MONTH'] as const;
export type PaymentTermBaseline = (typeof PAYMENT_TERM_BASELINES)[number];

export const PaymentTermBaselineValues = {
  INVOICE_DATE: 'INVOICE_DATE',
  GOODS_RECEIPT_DATE: 'GOODS_RECEIPT_DATE',
  END_OF_MONTH: 'END_OF_MONTH',
} as const satisfies Record<PaymentTermBaseline, PaymentTermBaseline>;

export const PAYMENT_TERM_BASELINE_LABELS: Record<PaymentTermBaseline, string> = {
  [PaymentTermBaselineValues.INVOICE_DATE]: 'Invoice date',
  [PaymentTermBaselineValues.GOODS_RECEIPT_DATE]: 'Goods receipt date',
  [PaymentTermBaselineValues.END_OF_MONTH]: 'End of invoice month',
};

export const PAYMENT_TERM_BASELINE_OPTIONS = PAYMENT_TERM_BASELINES.map((value) => ({
  value,
  label: PAYMENT_TERM_BASELINE_LABELS[value],
}));

// Filter options for the list's isPublished column — boolean filters travel as 'true' / 'false'
export const PAYMENT_TERM_STATUS_OPTIONS = [
  { value: 'true', label: 'Published' },
  { value: 'false', label: 'Draft' },
];

export const createPaymentTermSchema = z.object({
  name: z.string({ error: 'Name is required' }).min(1, 'Name is required').max(255),
  baseline: z.enum(PAYMENT_TERM_BASELINES, { error: 'Baseline is required' }),
  description: z.string().max(500),
});

export type CreatePaymentTermFormData = z.infer<typeof createPaymentTermSchema>;

export const editPaymentTermFormSchema = createPaymentTermSchema.omit({ baseline: true });
export type EditPaymentTermFormData = z.infer<typeof editPaymentTermFormSchema>;

export const changePaymentTermBaselineSchema = z.object({
  baseline: z.enum(PAYMENT_TERM_BASELINES, { error: 'Baseline is required' }),
});
export type ChangePaymentTermBaselineFormData = z.infer<typeof changePaymentTermBaselineSchema>;

const paymentTermRuleSchema = z
  .object({
    percent: zodNumericField({ required: 'Share is required', min: 0.01, max: 100, positive: true }),
    dueDays: zodNumericField({ required: 'Due days are required', min: 0, integer: true }),
    discountPercent: zodNumericField({ nullable: true, min: 0.01, max: 99.99 }),
    discountDays: zodNumericField({ nullable: true, min: 0, integer: true }),
  })
  .superRefine((rule, ctx) => {
    if (rule.percent != null && new Decimal(rule.percent).decimalPlaces() > 2) {
      ctx.addIssue({ code: 'custom', path: ['percent'], message: 'Up to 2 decimal places' });
    }
    if (rule.discountPercent != null && new Decimal(rule.discountPercent).decimalPlaces() > 2) {
      ctx.addIssue({ code: 'custom', path: ['discountPercent'], message: 'Up to 2 decimal places' });
    }
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
}

// How many rows each tab of a payment term's detail page lists
export interface PaymentTermCounts {
  ruleCount: number;
}

export interface PaymentTermData {
  id: string;
  name: string;
  baseline: PaymentTermBaseline;
  description: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTermDetailData extends PaymentTermData {
  ruleCount: number;
  supplierCount: number;
  enrollmentCount: number;
  canPublish: boolean;
  canUnpublish: boolean;
  canDelete: boolean;
}

export interface PaymentTermRulesData {
  totalPercent: number;
  rules: PaymentTermRuleData[];
}

export type PaymentTermsTableResponse = TableResponse<PaymentTermData>;

export interface CreatePaymentTermPayload {
  name: string;
  baseline: PaymentTermBaseline;
  description: string | null;
}

export type UpdatePaymentTermPayload = Partial<Omit<CreatePaymentTermPayload, 'baseline'>>;

export interface PaymentScheduleQuery {
  amount: string;
  currency: string;
  date: string;
}

export interface PaymentScheduleInstalment {
  ruleId: string;
  percent: number;
  dueDays: number;
  dueDate: string;
  amount: CurrencyAmount;
  discount: {
    percent: number;
    days: number;
    payBy: string;
    amount: CurrencyAmount;
    payable: CurrencyAmount;
  } | null;
}

export interface PaymentScheduleData {
  baseline: PaymentTermBaseline;
  baselineDate: string;
  total: CurrencyAmount;
  allocated: CurrencyAmount;
  unallocated: CurrencyAmount;
  maxSavings: CurrencyAmount;
  instalments: PaymentScheduleInstalment[];
}
