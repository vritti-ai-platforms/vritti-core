export const CONVERSIONS_KEY = ['commerce', 'conversions'] as const;
export const CONVERSIONS_TABLE_KEY = [...CONVERSIONS_KEY, 'table'] as const;
export const CONVERSION_KEY = (id: string) => [...CONVERSIONS_KEY, id] as const;
