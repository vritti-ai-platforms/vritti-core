export const LocationRoleValues = {
  STORAGE: 'STORAGE' as const,
  POS: 'POS' as const,
  ZONE: 'ZONE' as const,
};

export type LocationRole = (typeof LocationRoleValues)[keyof typeof LocationRoleValues];
