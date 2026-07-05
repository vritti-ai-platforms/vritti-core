import { coreSchema } from './core-schema';

export const userStatusEnum = coreSchema.enum('user_status', ['PENDING', 'ACTIVE', 'SUSPENDED']);
export const sessionTypeEnum = coreSchema.enum('session_type', ['WEB', 'SET_PASSWORD', 'RESET', 'MOBILE']);

// TypeScript type exports for use in DTOs and services
export type UserStatus = (typeof userStatusEnum.enumValues)[number];
export type SessionType = (typeof sessionTypeEnum.enumValues)[number];

// Runtime enum value objects for use in code
export const UserStatusValues = {
  PENDING: 'PENDING' as const,
  ACTIVE: 'ACTIVE' as const,
  SUSPENDED: 'SUSPENDED' as const,
};

export const SessionTypeValues = {
  WEB: 'WEB' as const,
  SET_PASSWORD: 'SET_PASSWORD' as const,
  RESET: 'RESET' as const,
  MOBILE: 'MOBILE' as const,
};

// Organization enums
export const orgPlanEnum = coreSchema.enum('org_plan', ['free', 'pro', 'enterprise']);
export const orgSizeEnum = coreSchema.enum('org_size', ['0-10', '10-20', '20-50', '50-100', '100-500', '500+']);

export type OrgPlan = (typeof orgPlanEnum.enumValues)[number];
export type OrgSize = (typeof orgSizeEnum.enumValues)[number];

export const OrgPlanValues = { free: 'free' as const, pro: 'pro' as const, enterprise: 'enterprise' as const };
export const OrgSizeValues = {
  s0_10: '0-10' as const,
  s10_20: '10-20' as const,
  s20_50: '20-50' as const,
  s50_100: '50-100' as const,
  s100_500: '100-500' as const,
  s500plus: '500+' as const,
};

// RBAC enums
export const buTypeEnum = coreSchema.enum('bu_type', [
  'ORGANIZATION',
  'REGION',
  'FRANCHISEE',
  'BRANCH',
  'TEAM',
  'DEPARTMENT',
  'CUSTOM',
]);
export const assignmentTypeEnum = coreSchema.enum('assignment_type', ['DIRECT', 'INHERITED']);

export type BuType = (typeof buTypeEnum.enumValues)[number];
export type AssignmentType = (typeof assignmentTypeEnum.enumValues)[number];

export const BuTypeValues = {
  ORGANIZATION: 'ORGANIZATION' as const,
  REGION: 'REGION' as const,
  FRANCHISEE: 'FRANCHISEE' as const,
  BRANCH: 'BRANCH' as const,
  TEAM: 'TEAM' as const,
  DEPARTMENT: 'DEPARTMENT' as const,
  CUSTOM: 'CUSTOM' as const,
};

export const AssignmentTypeValues = {
  DIRECT: 'DIRECT' as const,
  INHERITED: 'INHERITED' as const,
};

// Media enums
export const mediaStatusEnum = coreSchema.enum('media_status', ['pending', 'ready', 'failed', 'deleted']);
export type MediaStatus = (typeof mediaStatusEnum.enumValues)[number];
export const MediaStatusValues = {
  PENDING: 'pending' as const,
  READY: 'ready' as const,
  FAILED: 'failed' as const,
  DELETED: 'deleted' as const,
};

// BU-level default pick strategy used by commerce-service when removing stock (negative SAs,
// future sales). Item-level `inventory_items.pick_strategy` (lowercase, has 'none' = "inherit")
// can override per item; this enum carries no 'none' because the BU must always have a default.
export const pickStrategyEnum = coreSchema.enum('pick_strategy', ['FEFO', 'FIFO', 'LIFO']);
export type PickStrategy = (typeof pickStrategyEnum.enumValues)[number];
export const PickStrategyValues = {
  FEFO: 'FEFO' as const,
  FIFO: 'FIFO' as const,
  LIFO: 'LIFO' as const,
};
