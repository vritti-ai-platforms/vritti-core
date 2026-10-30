export const PAYMENT_TERMS_KEY = ['commerce', 'payment-terms'] as const;
export const PAYMENT_TERMS_TABLE_KEY = [...PAYMENT_TERMS_KEY, 'table'] as const;
export const PAYMENT_TERM_KEY = (id: string) => [...PAYMENT_TERMS_KEY, id] as const;
