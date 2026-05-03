import { axios } from '@vritti/quantum-ui-native/utils';

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

export interface SessionData {
  sessionId: string;
  device: string;
  ipAddress: string | null;
  lastActive: string;
  isCurrent: boolean;
}

export const changePassword = (data: ChangePasswordDto): Promise<SuccessResponse> => {
  return axios
    .post<SuccessResponse>('account/security/change-password', data, {
      loadingMessage: 'Changing password...',
      successMessage: 'Password changed successfully',
    })
    .then((r) => r.data);
};

export function getSessions(): Promise<SessionData[]> {
  return axios.get<SessionData[]>('account/security/sessions', { showSuccessToast: false }).then((r) => r.data);
}

export function revokeSession(sessionId: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`account/security/sessions/${sessionId}`, {
      loadingMessage: 'Revoking session...',
      successMessage: 'Session revoked successfully',
    })
    .then((r) => r.data);
}

export function revokeAllSessions(): Promise<SuccessResponse> {
  return axios
    .post<SuccessResponse>('account/security/sessions/revoke-all', null, {
      loadingMessage: 'Signing out all devices...',
      successMessage: 'Signed out from all other devices',
    })
    .then((r) => r.data);
}
