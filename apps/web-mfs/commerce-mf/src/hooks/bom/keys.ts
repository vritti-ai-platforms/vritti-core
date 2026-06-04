export const BOM_KEY = ['commerce', 'bom'] as const;
export const BOM_TABLE_KEY = [...BOM_KEY, 'table'] as const;
export const BOM_DETAIL_KEY = (id: string) => [...BOM_KEY, id] as const;
