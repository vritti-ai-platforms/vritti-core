import * as React from 'react';
import { useLookupOrganizations } from '../../hooks/auth';
import { useEmailLookupStep } from './AuthFlowContext';
import { AuthScreenLayout } from './components/AuthScreenLayout';
import { EmailLookupForm } from './form/EmailLookupForm';

export const EmailLookupScreen = () => {
  const { deploymentBaseURL, goBack, resolveOrganizations } = useEmailLookupStep();
  const [formError, setFormError] = React.useState<string | undefined>();

  const lookupMutation = useLookupOrganizations({
    onSuccess: (data, variables) => {
      setFormError(undefined);
      const { email } = variables;

      if (data.organizations.length === 0) {
        setFormError('No organizations were found for this email address.');
        return;
      }

      resolveOrganizations({
        email,
        organizations: data.organizations,
      });
    },
  });

  return (
    <AuthScreenLayout title="Enter your email" subtitle="We'll find your organizations" onBack={goBack}>
      <EmailLookupForm
        isSubmitting={lookupMutation.isPending}
        formError={formError}
        onSubmit={(email) => lookupMutation.mutate({ email, deploymentBaseURL })}
      />
    </AuthScreenLayout>
  );
};
