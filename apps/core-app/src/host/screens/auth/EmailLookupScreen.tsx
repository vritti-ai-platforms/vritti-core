import { usePushNavigator } from '@vritti/quantum-ui-native/hooks';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Text';
import { mapApiErrorsToForm } from '@vritti/quantum-ui-native/utils';
import { zodResolver } from '@vritti/quantum-ui-native/zod';
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

  const [lookupOrganizations, lookupResult] = useLookupOrganizations();

  const handleSubmit = async (values: EmailLookupFormValues) => {
    try {
      const result = await lookupOrganizations({ variables: { email: values.email } });
      // useLazyQuery may resolve with an `error` (errorPolicy) instead of throwing — handle both.
      if (result.error) {
        mapApiErrorsToForm(result.error, form);
        return;
      }
      if (!result.data) return;
      setOrganizations({ email: values.email, organizations: result.data.organizationsByEmail });
      push('OrgSelection');
    } catch (error) {
      mapApiErrorsToForm(error, form);
    }
  };

  return (
    <ScreenContainer className="px-5">
      <Text className="text-xl text-center font-bold">Enter your email</Text>
      <EmailLookupForm form={form} isSubmitting={lookupResult.loading} onSubmit={handleSubmit} />
    </ScreenContainer>
  );
};
