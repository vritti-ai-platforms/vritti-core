import { axios } from '@vritti/quantum-ui-native/utils';

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

// Hits the same backend endpoint as the web flow
// (apps/core-web/src/services/account/security.service.ts) — only the
// transport layer (mobile axios with loading/success toasts) differs.
export const changePassword = (data: ChangePasswordDto): Promise<SuccessResponse> => {
  return axios
    .post<SuccessResponse>('account/security/change-password', data, {
      loadingMessage: 'Changing password...',
      successMessage: 'Password changed successfully',
    })
    .then((r) => r.data);
};
