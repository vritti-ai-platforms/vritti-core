// A GROUP holds sub-categories; a CATEGORY is a leaf that holds inventory items.
export const CategoryRoleValues = {
  GROUP: 'GROUP' as const,
  CATEGORY: 'CATEGORY' as const,
};

export type CategoryRole = (typeof CategoryRoleValues)[keyof typeof CategoryRoleValues];
