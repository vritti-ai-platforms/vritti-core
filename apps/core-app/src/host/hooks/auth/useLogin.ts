import { completeMobileLoginSession } from '@vritti/quantum-ui-native/utils';
import type { MobileLoginInput } from '../../graphql/generated/graphql';
import type { LoginResponse } from '../../services/auth/auth.service';
import { type UseGqlMutationOptions, useGqlMutation } from '../useGqlMutation';
import { MOBILE_LOGIN } from './graphql';

interface MobileLoginData {
  mobileLogin: LoginResponse;
}

interface MobileLoginVariables {
  input: MobileLoginInput;
}

type UseLoginOptions = Omit<UseGqlMutationOptions<MobileLoginData, MobileLoginVariables>, 'mutation'>;

// Authenticates over GraphQL and, on success, hands the returned tokens to the package's
// session bootstrap — stores the refresh token in the Keychain and schedules the proactive
// refresh timer — exactly as the previous axios path did.
export function useLogin(options?: UseLoginOptions) {
  return useGqlMutation<MobileLoginData, MobileLoginVariables>(MOBILE_LOGIN, {
    ...options,
    onCompleted: async (data, clientOptions) => {
      await completeMobileLoginSession(data.mobileLogin);
      options?.onCompleted?.(data, clientOptions);
    },
  });
}
