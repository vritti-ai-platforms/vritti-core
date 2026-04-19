import { setMobileBaseURL } from '@vritti/quantum-ui-native/utils';
import * as React from 'react';
import { useAuth } from '../../providers/AuthProvider';
import type { LoginFormValues } from '../../schemas/auth/login';
import { useLogin } from '../../hooks/auth';
import { buildOrganizationApiBaseURL } from '../../services/auth/deployment.service';
import { useLoginStep } from './AuthFlowContext';
import { AuthScreenLayout } from './components/AuthScreenLayout';
import { LoginForm } from './form/LoginForm';

export const LoginScreen = () => {
  const { beginStatusConfirmation } = useAuth();
  const { deploymentBaseURL, email, organizationId, organizationName, organizationSubdomain, goBack } =
    useLoginStep();
  const [isPreparingTenantURL, setIsPreparingTenantURL] = React.useState(true);
  const [formError, setFormError] = React.useState<string | undefined>();

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
    <AuthScreenLayout title="Welcome back" subtitle={organizationName} onBack={goBack}>
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
    </AuthScreenLayout>
  );
};
