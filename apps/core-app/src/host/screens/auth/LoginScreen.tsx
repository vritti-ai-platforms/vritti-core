import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { setMobileBaseURL } from '@vritti/quantum-ui-native/utils';
import * as React from 'react';
import { useLogin } from '../../hooks/auth';
import { useAuthFlow } from '../../providers/AuthFlowProvider';
import { useAuth } from '../../providers/AuthProvider';
import type { LoginFormValues } from '../../schemas/auth/login';
import { buildOrganizationApiBaseURL } from '../../services/auth/deployment.service';
import { LoginForm } from './form/LoginForm';

export const LoginScreen = () => {
  const { beginStatusConfirmation } = useAuth();
  const { deploymentBaseURL, email, organizationId, organizationSubdomain } = useAuthFlow();
  const [isPreparingTenantURL, setIsPreparingTenantURL] = React.useState(true);
  const [formError, setFormError] = React.useState<string | undefined>();

  if (!deploymentBaseURL || !email || !organizationId || !organizationSubdomain) {
    throw new Error('LoginScreen requires an organization to be selected first');
  }

  const loginMutation = useLogin({
    onSuccess: () => {
      beginStatusConfirmation();
    },
  });

  React.useEffect(() => {
    let active = true;

    const configureTenantURL = async () => {
      setIsPreparingTenantURL(true);
      setFormError(undefined);

      try {
        const tenantBaseURL = buildOrganizationApiBaseURL(deploymentBaseURL, organizationSubdomain);
        await setMobileBaseURL(tenantBaseURL);
      } catch {
        if (active) {
          setFormError('Unable to prepare the organization URL. Please go back and try again.');
        }
      } finally {
        if (active) {
          setIsPreparingTenantURL(false);
        }
      }
    };

    configureTenantURL();

    return () => {
      active = false;
    };
  }, [deploymentBaseURL, organizationSubdomain]);

  return (
    <ScreenContainer className="px-5">
      <Text className="text-xl text-center font-bold">Welcome back</Text>
      <LoginForm
        email={email}
        formError={formError}
        isSubmitting={loginMutation.isPending}
        isPreparingTenantURL={isPreparingTenantURL}
        onSubmit={(data: LoginFormValues) => {
          if (isPreparingTenantURL) return;
          loginMutation.mutate({
            email: data.email,
            password: data.password,
            organizationId,
          });
        }}
      />
    </ScreenContainer>
  );
};
