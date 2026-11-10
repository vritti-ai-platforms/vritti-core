export const TAX_CLASSES_KEY = ['commerce', 'tax-classes'] as const;
export const TAX_CLASSES_TABLE_KEY = [...TAX_CLASSES_KEY, 'table'] as const;
export const TAX_CLASS_KEY = (id: string) => [...TAX_CLASSES_KEY, id] as const;
export const TAX_CLASS_GROUPS_TABLE_KEY = (id: string) => [...TAX_CLASS_KEY(id), 'groups', 'table'] as const;
