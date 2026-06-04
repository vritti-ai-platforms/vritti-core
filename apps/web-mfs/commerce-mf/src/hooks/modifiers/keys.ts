export const MODIFIER_GROUPS_KEY = ['modifier-groups'] as const;
export const MODIFIER_GROUP_KEY = (catalogId: string, groupId: string) =>
  [...MODIFIER_GROUPS_KEY, catalogId, groupId] as const;
export const MODIFIER_GROUPS_BY_CATALOG_KEY = (catalogId: string) => [...MODIFIER_GROUPS_KEY, catalogId] as const;
