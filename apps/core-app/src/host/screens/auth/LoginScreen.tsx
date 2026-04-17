import { setMobileBaseURL } from '@vritti/quantum-ui-native/utils';
import * as React from 'react';
import type { LoginFormValues } from '../../schemas/auth/login';
import { useLogin } from '../../hooks/auth';
import { buildOrganizationApiBaseURL } from '../../services/auth/deployment.service';
import { AuthScreenLayout } from './components/AuthScreenLayout';
import { LoginForm } from './form/LoginForm';

interface Props {
  deploymentBaseURL: string;
  email: string;
  organizationId: string;
  organizationName: string;
  organizationSubdomain: string;
  onBack: () => void;
  onAuthenticated: () => void;
}

export const LoginScreen = ({
  deploymentBaseURL,
  email,
  organizationId,
  organizationName,
  organizationSubdomain,
  onBack,
  onAuthenticated,
}: Props) => {
  const [isPreparingTenantURL, setIsPreparingTenantURL] = React.useState(true);
  const [formError, setFormError] = React.useState<string | undefined>();

  const loginMutation = useLogin({
    onSuccess: () => {
      onAuthenticated();
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
    <AuthScreenLayout title="Welcome back" subtitle={organizationName} onBack={onBack}>
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
