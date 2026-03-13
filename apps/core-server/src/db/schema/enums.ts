import { nexusSchema } from './nexus-schema';

export const userRoleEnum = nexusSchema.enum('user_role', ['SUPER_ADMIN', 'ADMIN', 'SUPPORT']);
export const userStatusEnum = nexusSchema.enum('user_status', ['PENDING', 'ACTIVE', 'SUSPENDED']);
export const sessionTypeEnum = nexusSchema.enum('session_type', ['NEXUS', 'SET_PASSWORD', 'RESET']);

// TypeScript type exports for use in DTOs and services
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type UserStatus = (typeof userStatusEnum.enumValues)[number];
export type SessionType = (typeof sessionTypeEnum.enumValues)[number];

// Runtime enum value objects for use in code
export const UserRoleValues = {
  SUPER_ADMIN: 'SUPER_ADMIN' as const,
  ADMIN: 'ADMIN' as const,
  SUPPORT: 'SUPPORT' as const,
};

export const UserStatusValues = {
  PENDING: 'PENDING' as const,
  ACTIVE: 'ACTIVE' as const,
  SUSPENDED: 'SUSPENDED' as const,
};

export const SessionTypeValues = {
  NEXUS: 'NEXUS' as const,
  SET_PASSWORD: 'SET_PASSWORD' as const,
  RESET: 'RESET' as const,
};

// Organization enums
export const orgPlanEnum = nexusSchema.enum('org_plan', ['free', 'pro', 'enterprise']);
export const orgSizeEnum = nexusSchema.enum('org_size', ['0-10', '10-20', '20-50', '50-100', '100-500', '500+']);

export type OrgPlan = (typeof orgPlanEnum.enumValues)[number];
export type OrgSize = (typeof orgSizeEnum.enumValues)[number];

export const OrgPlanValues = { free: 'free' as const, pro: 'pro' as const, enterprise: 'enterprise' as const };
export const OrgSizeValues = { s0_10: '0-10' as const, s10_20: '10-20' as const, s20_50: '20-50' as const, s50_100: '50-100' as const, s100_500: '100-500' as const, s500plus: '500+' as const };
