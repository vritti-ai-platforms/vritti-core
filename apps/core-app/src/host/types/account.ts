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
  displayName: string;
  status: string;
  hasPassword: boolean;
  locale: string;
  timezone: string;
  createdAt: string;
  lastLoginAt: string | null;
}
