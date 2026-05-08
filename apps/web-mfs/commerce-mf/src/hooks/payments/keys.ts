export const PAYMENTS_KEY = ['commerce', 'payments'] as const;
export const INVOICE_PAYMENTS_KEY = (invoiceId: string) => [...PAYMENTS_KEY, invoiceId] as const;
