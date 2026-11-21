import type { PaymentScheduleQuery } from '@/schemas/payment-terms';

export const PAYMENT_TERMS_KEY = ['commerce', 'payment-terms'] as const;
export const PAYMENT_TERMS_TABLE_KEY = [...PAYMENT_TERMS_KEY, 'table'] as const;
export const PAYMENT_TERM_KEY = (id: string) => [...PAYMENT_TERMS_KEY, id] as const;
export const PAYMENT_TERM_COUNTS_KEY = (id: string) => [...PAYMENT_TERM_KEY(id), 'counts'] as const;
export const PAYMENT_TERM_RULES_KEY = (id: string) => [...PAYMENT_TERM_KEY(id), 'rules'] as const;
export const PAYMENT_TERM_SCHEDULE_KEY = (id: string, query: PaymentScheduleQuery) =>
  [...PAYMENT_TERM_KEY(id), 'schedule', query] as const;
