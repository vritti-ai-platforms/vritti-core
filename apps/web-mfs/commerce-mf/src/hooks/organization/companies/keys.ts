export const COMPANIES_KEY = ['commerce', 'org', 'companies'] as const;
export const COMPANIES_TABLE_KEY = [...COMPANIES_KEY, 'table'] as const;
export const COMPANY_KEY = (id: string) => [...COMPANIES_KEY, id] as const;
export const COMPANY_PEOPLE_TABLE_KEY = (id: string) => [...COMPANY_KEY(id), 'people'] as const;
export const COMPANY_REGISTRATIONS_TABLE_KEY = (id: string) => [...COMPANY_KEY(id), 'registrations'] as const;
export const COMPANY_IDENTIFIERS_TABLE_KEY = (id: string) => [...COMPANY_KEY(id), 'identifiers'] as const;
export const COMPANY_ADDRESSES_TABLE_KEY = (id: string) => [...COMPANY_KEY(id), 'addresses'] as const;
