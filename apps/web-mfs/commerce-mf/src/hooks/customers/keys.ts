export const CUSTOMERS_KEY = ['commerce', 'customers'] as const;
export const CUSTOMERS_TABLE_KEY = [...CUSTOMERS_KEY, 'table'] as const;

export const CUSTOMER_KEY = (customerId: string) => [...CUSTOMERS_KEY, customerId] as const;
