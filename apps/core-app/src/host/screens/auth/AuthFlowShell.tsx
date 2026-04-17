import { useState } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import type { LookupOrganization } from '../../services/auth/auth.service';
import { DeploymentSelectionScreen } from './DeploymentSelectionScreen';
import { EmailLookupScreen } from './EmailLookupScreen';
import { LoginScreen } from './LoginScreen';
import { OrgSelectionScreen } from './OrgSelectionScreen';

type AuthFlowState =
  | { step: 'deployment' }
  | { step: 'emailLookup'; deploymentBaseURL: string }
  | { step: 'orgSelection'; deploymentBaseURL: string; email: string; organizations: LookupOrganization[] }
  | {
      step: 'login';
      deploymentBaseURL: string;
      email: string;
      organizationId: string;
      organizationName: string;
      organizationSubdomain: string;
      from: { step: 'emailLookup' } | { step: 'orgSelection'; organizations: LookupOrganization[] };
    };

export function AuthFlowShell() {
  const { markAuthenticated } = useAuth();
  const [flow, setFlow] = useState<AuthFlowState>({ step: 'deployment' });

  if (flow.step === 'deployment') {
    return (
      <DeploymentSelectionScreen
        onConnected={(deploymentBaseURL) => {
          setFlow({ step: 'emailLookup', deploymentBaseURL });
        }}
      />
    );
  }

  if (flow.step === 'emailLookup') {
    return (
      <EmailLookupScreen
        deploymentBaseURL={flow.deploymentBaseURL}
        onBack={() => {
          setFlow({ step: 'deployment' });
        }}
        onOrganizationsResolved={({ email, organizations }) => {
          setFlow({
            step: 'orgSelection',
            deploymentBaseURL: flow.deploymentBaseURL,
            email,
            organizations,
          });
        }}
      />
    );
  }

  if (flow.step === 'orgSelection') {
    return (
      <OrgSelectionScreen
        email={flow.email}
        organizations={flow.organizations}
        onBack={() => {
          setFlow({ step: 'emailLookup', deploymentBaseURL: flow.deploymentBaseURL });
        }}
        onSelectOrg={({ email, organizationId, organizationName, organizationSubdomain }) => {
          setFlow({
            step: 'login',
            deploymentBaseURL: flow.deploymentBaseURL,
            email,
            organizationId,
            organizationName,
            organizationSubdomain,
            from: {
              step: 'orgSelection',
              organizations: flow.organizations,
            },
          });
        }}
      />
    );
  }

  return (
    <LoginScreen
      deploymentBaseURL={flow.deploymentBaseURL}
      email={flow.email}
      organizationId={flow.organizationId}
      organizationName={flow.organizationName}
      organizationSubdomain={flow.organizationSubdomain}
      onBack={() => {
        if (flow.from.step === 'orgSelection') {
          setFlow({
            step: 'orgSelection',
            deploymentBaseURL: flow.deploymentBaseURL,
            email: flow.email,
            organizations: flow.from.organizations,
          });
          return;
        }

        setFlow({
          step: 'emailLookup',
          deploymentBaseURL: flow.deploymentBaseURL,
        });
      }}
      onAuthenticated={markAuthenticated}
    />
  );
}
