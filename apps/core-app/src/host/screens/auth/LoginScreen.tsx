import { zodResolver } from '@hookform/resolvers/zod';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Text';
import { mapApiErrorsToForm, setMobileBaseURL } from '@vritti/quantum-ui-native/utils';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useLogin } from '../../hooks/auth';
import { useAuthFlow } from '../../providers/AuthFlowProvider';
import { useAuth } from '../../providers/AuthProvider';
import { type LoginFormValues, loginSchema } from '../../schemas/auth/login';
import { buildOrganizationApiBaseURL } from '../../services/auth/deployment.service';
import { LoginForm } from './form/LoginForm';

export const LoginScreen = () => {
  const { beginStatusConfirmation } = useAuth();
  const { deploymentBaseURL, email, organizationId, organizationSubdomain } = useAuthFlow();
  const [isPreparingTenantURL, setIsPreparingTenantURL] = React.useState(true);

  if (!deploymentBaseURL || !email || !organizationId || !organizationSubdomain) {
    throw new Error('LoginScreen requires an organization to be selected first');
  }

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email, password: '' },
  });

  const [login, loginResult] = useLogin({
    onCompleted: () => {
      beginStatusConfirmation();
    },
  });

  React.useEffect(() => {
    let active = true;

    const configureTenantURL = async () => {
      setIsPreparingTenantURL(true);
      form.clearErrors('root');

      try {
        const tenantBaseURL = buildOrganizationApiBaseURL(deploymentBaseURL, organizationSubdomain);
        await setMobileBaseURL(tenantBaseURL);
      } catch {
        if (active) {
          form.setError('root', {
            type: 'Workspace Unavailable',
            message: 'Unable to prepare the organization URL. Please go back and try again.',
          });
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
  }, [deploymentBaseURL, organizationSubdomain, form]);

  const handleSubmit = async (values: LoginFormValues) => {
    if (isPreparingTenantURL) return;
    try {
      await login({
        variables: {
          input: {
            email: values.email,
            password: values.password,
            organizationId,
          },
        },
      });
    } catch (error) {
      mapApiErrorsToForm(error, form);
    }
  };

  return (
    <ScreenContainer className="px-5">
      <Text className="text-xl text-center font-bold">Welcome back</Text>
      <LoginForm
        form={form}
        isSubmitting={loginResult.loading}
        isPreparingTenantURL={isPreparingTenantURL}
        onSubmit={handleSubmit}
      />
    </ScreenContainer>
  );
};
