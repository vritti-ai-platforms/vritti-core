import { Text, usePushNavigator } from '@vritti/quantum-ui-native';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import * as React from 'react';
import { useLookupOrganizations } from '../../hooks/auth';
import { useAuthFlow } from '../../providers/AuthFlowProvider';
import type { AuthRoute } from '../../routes/auth/authRoutes';
import { EmailLookupForm } from './form/EmailLookupForm';

export const EmailLookupScreen = () => {
  const { deploymentBaseURL, setOrganizations } = useAuthFlow();
  const { push } = usePushNavigator<AuthRoute>();
  const [formError, setFormError] = React.useState<string | undefined>();

  const lookupMutation = useLookupOrganizations({
    onSuccess: (data, variables) => {
      setFormError(undefined);
      const { email } = variables;

      if (data.organizations.length === 0) {
        setFormError('No organizations were found for this email address.');
        return;
      }

      setOrganizations({ email, organizations: data.organizations });
      push('OrgSelection');
    },
  });

  if (!deploymentBaseURL) {
    throw new Error('EmailLookupScreen requires a deployment to be selected first');
  }

  return (
    <ScreenContainer className="px-5">
      <Text className="text-xl text-center font-bold">Enter your email</Text>
      <EmailLookupForm
        isSubmitting={lookupMutation.isPending}
        formError={formError}
        onSubmit={(email) => lookupMutation.mutate({ email, deploymentBaseURL })}
      />
    </ScreenContainer>
  );
};
