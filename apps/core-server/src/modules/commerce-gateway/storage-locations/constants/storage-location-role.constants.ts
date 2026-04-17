export const StorageLocationRoleValues = {
  STORAGE: 'STORAGE' as const,
  POS: 'POS' as const,
  ZONE: 'ZONE' as const,
};

export type StorageLocationRole = (typeof StorageLocationRoleValues)[keyof typeof StorageLocationRoleValues];
