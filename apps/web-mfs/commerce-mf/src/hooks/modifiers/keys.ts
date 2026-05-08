export const MODIFIER_GROUPS_KEY = ['modifier-groups'] as const;
export const MODIFIER_GROUP_KEY = (id: string) => [...MODIFIER_GROUPS_KEY, id] as const;
export const MODIFIER_GROUPS_BY_BU_KEY = (buId: string) => [...MODIFIER_GROUPS_KEY, buId] as const;
