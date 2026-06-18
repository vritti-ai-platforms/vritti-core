// Account domain types — mirror the core-server GraphQL schema (Profile, UserSession,
// ChangePasswordInput, MessageResponse). Used as explicit generics on the Apollo hooks in
// hooks/account so results/variables stay typed without depending on codegen output.

export interface MessageResponse {
  success?: boolean | null;
  message: string;
}

export interface SessionData {
  sessionId: string;
  device: string;
  ipAddress: string | null;
  lastActive: string;
  isCurrent: boolean;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  displayName: string | null;
  status: string;
  hasPassword: boolean;
  locale: string;
  timezone: string;
  createdAt: string;
  lastLoginAt: string | null;
}
