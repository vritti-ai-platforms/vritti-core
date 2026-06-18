import { gql } from '@apollo/client';
import type { ChangePasswordInput, MessageResponse } from '../../types/account';
import { type UseGqlMutationOptions, useGqlMutation } from '../useGqlMutation';

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      success
      message
    }
  }
`;

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
