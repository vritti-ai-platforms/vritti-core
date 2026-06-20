import { CHANGE_PASSWORD_MUTATION } from '../../graphql/account';
import type { ChangePasswordInput, MessageResponse } from '../../types/account';
import { type UseGqlMutationOptions, useGqlMutation } from '../useGqlMutation';

interface ChangePasswordResult {
  changePassword: MessageResponse;
}

interface ChangePasswordVariables {
  input: ChangePasswordInput;
}

type UseChangePasswordOptions = Omit<UseGqlMutationOptions<ChangePasswordResult, ChangePasswordVariables>, 'mutation'>;

export function useChangePassword(options?: UseChangePasswordOptions) {
  return useGqlMutation<ChangePasswordResult, ChangePasswordVariables>(CHANGE_PASSWORD_MUTATION, {
    toast: {
      loadingMessage: 'Changing password...',
      successMessage: 'Password changed successfully',
    },
    ...options,
  });
}
