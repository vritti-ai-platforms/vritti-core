export const LocationRoleValues = {
  STORAGE: 'STORAGE' as const,
  RESERVED_STORAGE: 'RESERVED_STORAGE' as const,
  ZONE: 'ZONE' as const,
};

export type LocationRole = (typeof LocationRoleValues)[keyof typeof LocationRoleValues];
