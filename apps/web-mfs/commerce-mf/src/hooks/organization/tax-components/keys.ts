export const TAX_COMPONENTS_KEY = ['commerce', 'tax-components'] as const;
export const TAX_COMPONENTS_TABLE_KEY = [...TAX_COMPONENTS_KEY, 'table'] as const;
export const TAX_COMPONENT_KEY = (id: string) => [...TAX_COMPONENTS_KEY, id] as const;
