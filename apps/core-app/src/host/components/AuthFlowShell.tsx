import { useState } from 'react';
import { DeploymentSelectionScreen } from '../screens/DeploymentSelectionScreen';
import { EmailLookupScreen } from '../screens/EmailLookupScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OrgSelectionScreen } from '../screens/OrgSelectionScreen';
import { useAuth } from '../providers/AuthProvider';
import type { LookupOrganization } from '../services/auth.service';

type AuthFlowState =
  | { step: 'deployment' }
  | { step: 'emailLookup' }
  | { step: 'orgSelection'; email: string; organizations: LookupOrganization[] }
  | { step: 'login'; email: string; organizationId: string; organizationName: string };

export function AuthFlowShell() {
  const { markAuthenticated } = useAuth();
  const [flow, setFlow] = useState<AuthFlowState>({ step: 'deployment' });

  if (flow.step === 'deployment') {
    return (
      <DeploymentSelectionScreen
        onConnected={() => {
          setFlow({ step: 'emailLookup' });
        }}
      />
    );
  }

  if (flow.step === 'emailLookup') {
    return (
      <EmailLookupScreen
        onSingleOrgLogin={({ email, organizationId, organizationName }) => {
          setFlow({ step: 'login', email, organizationId, organizationName });
        }}
        onMultipleOrgs={({ email, organizations }) => {
          setFlow({ step: 'orgSelection', email, organizations });
        }}
      />
    );
  }

  if (flow.step === 'orgSelection') {
    return (
      <OrgSelectionScreen
        email={flow.email}
        organizations={flow.organizations}
        onSelectOrg={({ email, organizationId, organizationName }) => {
          setFlow({ step: 'login', email, organizationId, organizationName });
        }}
      />
    );
  }

  return (
    <LoginScreen
      email={flow.email}
      organizationId={flow.organizationId}
      organizationName={flow.organizationName}
      onAuthenticated={markAuthenticated}
    />
  );
}
