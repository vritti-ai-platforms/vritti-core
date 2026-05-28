export const COST_CATEGORIES_KEY = ['commerce', 'cost-categories'] as const;
export const COST_CATEGORIES_TABLE_KEY = [...COST_CATEGORIES_KEY, 'table'] as const;
export const COST_CATEGORY_KEY = (id: string) => [...COST_CATEGORIES_KEY, id] as const;
