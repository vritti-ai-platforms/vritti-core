export const CATEGORIES_KEY = ['commerce', 'categories'] as const;
export const CATEGORY_COUNT_KEY = [...CATEGORIES_KEY, 'count'] as const;
export const CATEGORY_TREE_KEY = [...CATEGORIES_KEY, 'tree'] as const;
export const CATEGORY_CHILDREN_TABLE_KEY = (parentId: string) =>
  [...CATEGORIES_KEY, parentId, 'children-table'] as const;
export const CATEGORY_ITEMS_TABLE_KEY = (categoryId: string) => [...CATEGORIES_KEY, categoryId, 'items-table'] as const;
