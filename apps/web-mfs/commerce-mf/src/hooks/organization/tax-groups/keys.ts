export const TAX_GROUPS_KEY = ['commerce', 'tax-groups'] as const;
export const TAX_GROUPS_TABLE_KEY = [...TAX_GROUPS_KEY, 'table'] as const;
export const TAX_GROUP_KEY = (id: string) => [...TAX_GROUPS_KEY, id] as const;
export const TAX_GROUP_RATES_TABLE_KEY = (id: string) => [...TAX_GROUP_KEY(id), 'rates', 'table'] as const;
export const TAX_GROUP_CLASSES_TABLE_KEY = (id: string) => [...TAX_GROUP_KEY(id), 'classes', 'table'] as const;
