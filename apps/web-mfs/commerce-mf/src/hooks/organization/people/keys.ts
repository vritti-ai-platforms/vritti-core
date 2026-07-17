export const PEOPLE_KEY = ['commerce', 'org', 'people'] as const;
export const PEOPLE_TABLE_KEY = [...PEOPLE_KEY, 'table'] as const;
export const PERSON_KEY = (id: string) => [...PEOPLE_KEY, id] as const;
export const PERSON_IDENTIFIERS_KEY = (id: string) => [...PERSON_KEY(id), 'identifiers'] as const;
export const PERSON_ADDRESSES_TABLE_KEY = (id: string) => [...PERSON_KEY(id), 'addresses'] as const;
export const PERSON_COMPANIES_TABLE_KEY = (id: string) => [...PERSON_KEY(id), 'companies'] as const;
