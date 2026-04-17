import * as React from 'react';
import { useLookupOrganizations } from '../../hooks/auth';
import type { LookupOrganization } from '../../services/auth/auth.service';
import { AuthScreenLayout } from './components/AuthScreenLayout';
import { EmailLookupForm } from './form/EmailLookupForm';

interface Props {
  deploymentBaseURL: string;
  onBack: () => void;
  onOrganizationsResolved: (args: { email: string; organizations: LookupOrganization[] }) => void;
}

export const EmailLookupScreen = ({ deploymentBaseURL, onBack, onOrganizationsResolved }: Props) => {
  const [formError, setFormError] = React.useState<string | undefined>();

  const lookupMutation = useLookupOrganizations({
    onSuccess: (data, variables) => {
      setFormError(undefined);
      const { email } = variables;

      if (data.organizations.length === 0) {
        setFormError('No organizations were found for this email address.');
        return;
      }

      onOrganizationsResolved({
        email,
        organizations: data.organizations,
      });
    },
  });

  return (
    <AuthScreenLayout title="Enter your email" subtitle="We'll find your organizations" onBack={onBack}>
      <EmailLookupForm
        isSubmitting={lookupMutation.isPending}
        formError={formError}
        onSubmit={(email) => lookupMutation.mutate({ email, deploymentBaseURL })}
      />
    </AuthScreenLayout>
  );
};
