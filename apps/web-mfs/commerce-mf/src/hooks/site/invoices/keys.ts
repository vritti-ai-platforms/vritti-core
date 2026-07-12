export const INVOICES_KEY = ['commerce', 'invoices'] as const;
export const INVOICES_TABLE_KEY = [...INVOICES_KEY, 'table'] as const;
export const INVOICE_KEY = (id: string) => [...INVOICES_KEY, id] as const;
