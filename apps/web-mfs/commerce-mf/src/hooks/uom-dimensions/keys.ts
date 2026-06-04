export const UOM_DIMENSIONS_KEY = ['commerce', 'uom-dimensions'] as const;
export const UOM_DIMENSIONS_COUNT_KEY = [...UOM_DIMENSIONS_KEY, 'count'] as const;
export const UOM_DIMENSIONS_LIST_KEY = [...UOM_DIMENSIONS_KEY, 'list'] as const;
export const UOM_DIMENSION_DETAIL_KEY = (id: string) => [...UOM_DIMENSIONS_KEY, 'detail', id] as const;
