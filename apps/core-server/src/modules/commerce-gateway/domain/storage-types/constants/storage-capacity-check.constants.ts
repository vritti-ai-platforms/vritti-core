export const StorageCapacityCheckValues = {
  NONE: 'NONE' as const,
  WARN: 'WARN' as const,
  BLOCK: 'BLOCK' as const,
};

export type StorageCapacityCheck = (typeof StorageCapacityCheckValues)[keyof typeof StorageCapacityCheckValues];
