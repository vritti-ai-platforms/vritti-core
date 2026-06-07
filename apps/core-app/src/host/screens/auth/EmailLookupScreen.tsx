import { zodResolver } from '@hookform/resolvers/zod';
import { usePushNavigator } from '@vritti/quantum-ui-native/hooks';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Text';
import { mapApiErrorsToForm } from '@vritti/quantum-ui-native/utils';
import { useForm } from 'react-hook-form';
import { useLookupOrganizations } from '../../hooks/auth';
import { useAuthFlow } from '../../providers/AuthFlowProvider';
import type { AuthRoute } from '../../routes/auth/authRoutes';
import { type EmailLookupFormValues, emailLookupSchema } from '../../schemas/auth/emailLookup';
import { EmailLookupForm } from './form/EmailLookupForm';

export const EmailLookupScreen = () => {
  const { deploymentBaseURL, setOrganizations } = useAuthFlow();
  const { push } = usePushNavigator<AuthRoute>();

  if (!deploymentBaseURL) {
    throw new Error('EmailLookupScreen requires a deployment to be selected first');
  }

  const form = useForm<EmailLookupFormValues>({
    resolver: zodResolver(emailLookupSchema),
    defaultValues: { email: '' },
  });

  const lookupMutation = useLookupOrganizations({
    onSuccess: (data, variables) => {
      setOrganizations({ email: variables.email, organizations: data.organizations });
      push('OrgSelection');
    },
  });

  const handleSubmit = async (values: EmailLookupFormValues) => {
    try {
      await lookupMutation.mutateAsync({ email: values.email, deploymentBaseURL });
    } catch (error) {
      mapApiErrorsToForm(error, form);
    }
  };

  return (
    <ScreenContainer className="px-5">
      <Text className="text-xl text-center font-bold">Enter your email</Text>
      <EmailLookupForm form={form} isSubmitting={lookupMutation.isPending} onSubmit={handleSubmit} />
    </ScreenContainer>
  );
};
