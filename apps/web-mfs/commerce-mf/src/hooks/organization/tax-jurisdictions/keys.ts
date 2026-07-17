export const TAX_JURISDICTIONS_KEY = ['commerce', 'tax-jurisdictions'] as const;
export const TAX_JURISDICTION_COUNT_KEY = [...TAX_JURISDICTIONS_KEY, 'count'] as const;
export const TAX_JURISDICTION_TREE_KEY = [...TAX_JURISDICTIONS_KEY, 'tree'] as const;
export const TAX_JURISDICTION_CHILDREN_TABLE_KEY = (parentId: string) =>
  [...TAX_JURISDICTIONS_KEY, parentId, 'children-table'] as const;
