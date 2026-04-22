import React, { createContext, useContext, useMemo, useState } from 'react';
import type { LookupOrganization } from '../../services/auth/auth.service';

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

interface AuthFlowContextValue {
  flow: AuthFlowState;
  connectDeployment: (deploymentBaseURL: string) => void;
  resolveOrganizations: (args: { email: string; organizations: LookupOrganization[] }) => void;
  selectOrganization: (args: {
    email: string;
    organizationId: string;
    organizationName: string;
    organizationSubdomain: string;
  }) => void;
  backFromEmailLookup: () => void;
  backFromOrgSelection: () => void;
  backFromLogin: () => void;
  resetToDeployment: () => void;
}

const AuthFlowContext = createContext<AuthFlowContextValue | null>(null);

export const useAuthFlow = (): AuthFlowContextValue => {
  const ctx = useContext(AuthFlowContext);
  if (!ctx) throw new Error('useAuthFlow must be used within AuthFlowProvider');
  return ctx;
};

export const useEmailLookupStep = () => {
  const { flow, backFromEmailLookup, resolveOrganizations } = useAuthFlow();

  if (flow.step !== 'emailLookup') {
    throw new Error('useEmailLookupStep must be used while the auth flow is on emailLookup');
  }

  return {
    deploymentBaseURL: flow.deploymentBaseURL,
    goBack: backFromEmailLookup,
    resolveOrganizations,
  };
};

export const useOrgSelectionStep = () => {
  const { flow, backFromOrgSelection, selectOrganization } = useAuthFlow();

  if (flow.step !== 'orgSelection') {
    throw new Error('useOrgSelectionStep must be used while the auth flow is on orgSelection');
  }

  return {
    email: flow.email,
    organizations: flow.organizations,
    goBack: backFromOrgSelection,
    selectOrganization,
  };
};

export const useLoginStep = () => {
  const { flow, backFromLogin } = useAuthFlow();

  if (flow.step !== 'login') {
    throw new Error('useLoginStep must be used while the auth flow is on login');
  }

  return {
    deploymentBaseURL: flow.deploymentBaseURL,
    email: flow.email,
    organizationId: flow.organizationId,
    organizationName: flow.organizationName,
    organizationSubdomain: flow.organizationSubdomain,
    goBack: backFromLogin,
  };
};

interface AuthFlowProviderProps {
  children: React.ReactNode;
}

export const AuthFlowProvider = ({ children }: AuthFlowProviderProps) => {
  const [flow, setFlow] = useState<AuthFlowState>({ step: 'deployment' });

  const value = useMemo<AuthFlowContextValue>(
    () => ({
      flow,
      connectDeployment: (deploymentBaseURL) => {
        setFlow({ step: 'emailLookup', deploymentBaseURL });
      },
      resolveOrganizations: ({ email, organizations }) => {
        setFlow((current) => {
          if (current.step !== 'emailLookup') {
            throw new Error('resolveOrganizations can only be called from the emailLookup step');
          }

          return {
            step: 'orgSelection',
            deploymentBaseURL: current.deploymentBaseURL,
            email,
            organizations,
          };
        });
      },
      selectOrganization: ({ email, organizationId, organizationName, organizationSubdomain }) => {
        setFlow((current) => {
          if (current.step !== 'orgSelection') {
            throw new Error('selectOrganization can only be called from the orgSelection step');
          }

          return {
            step: 'login',
            deploymentBaseURL: current.deploymentBaseURL,
            email,
            organizationId,
            organizationName,
            organizationSubdomain,
            from: {
              step: 'orgSelection',
              organizations: current.organizations,
            },
          };
        });
      },
      backFromEmailLookup: () => {
        setFlow({ step: 'deployment' });
      },
      backFromOrgSelection: () => {
        setFlow((current) => {
          if (current.step !== 'orgSelection') {
            throw new Error('backFromOrgSelection can only be called from the orgSelection step');
          }

          return {
            step: 'emailLookup',
            deploymentBaseURL: current.deploymentBaseURL,
          };
        });
      },
      backFromLogin: () => {
        setFlow((current) => {
          if (current.step !== 'login') {
            throw new Error('backFromLogin can only be called from the login step');
          }

          if (current.from.step === 'orgSelection') {
            return {
              step: 'orgSelection',
              deploymentBaseURL: current.deploymentBaseURL,
              email: current.email,
              organizations: current.from.organizations,
            };
          }

          return {
            step: 'emailLookup',
            deploymentBaseURL: current.deploymentBaseURL,
          };
        });
      },
      resetToDeployment: () => {
        setFlow({ step: 'deployment' });
      },
    }),
    [flow],
  );

  return <AuthFlowContext.Provider value={value}>{children}</AuthFlowContext.Provider>;
};
