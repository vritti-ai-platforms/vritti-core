export const LOCATIONS_KEY = ['commerce', 'locations'] as const;
export const LOCATION_COUNT_KEY = [...LOCATIONS_KEY, 'count'] as const;
export const LOCATION_TREE_KEY = [...LOCATIONS_KEY, 'tree'] as const;
export const LOCATION_CHILDREN_TABLE_KEY = (parentId: string) =>
  [...LOCATIONS_KEY, parentId, 'children-table'] as const;
