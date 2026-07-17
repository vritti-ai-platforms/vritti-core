export const TAX_CLASSES_KEY = ['commerce', 'tax-classes'] as const;
export const TAX_CLASSES_TABLE_KEY = [...TAX_CLASSES_KEY, 'table'] as const;
export const TAX_CLASS_KEY = (id: string) => [...TAX_CLASSES_KEY, id] as const;
