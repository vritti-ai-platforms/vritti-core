import React, { createContext, useContext, useMemo, useState } from 'react';
import type { LookupOrganization } from '../services/auth/auth.service';

interface AuthFlowState {
  deploymentBaseURL: string | null;
  email: string | null;
  organizations: LookupOrganization[];
  organizationId: string | null;
  organizationName: string | null;
  organizationSubdomain: string | null;
}

interface AuthFlowContextValue extends AuthFlowState {
  setDeployment: (deploymentBaseURL: string) => void;
  setOrganizations: (args: { email: string; organizations: LookupOrganization[] }) => void;
  selectOrganization: (args: {
    organizationId: string;
    organizationName: string;
    organizationSubdomain: string;
  }) => void;
  reset: () => void;
}

const initialState: AuthFlowState = {
  deploymentBaseURL: null,
  email: null,
  organizations: [],
  organizationId: null,
  organizationName: null,
  organizationSubdomain: null,
};

const AuthFlowContext = createContext<AuthFlowContextValue | null>(null);

export const useAuthFlow = (): AuthFlowContextValue => {
  const ctx = useContext(AuthFlowContext);
  if (!ctx) throw new Error('useAuthFlow must be used within AuthFlowProvider');
  return ctx;
};

interface AuthFlowProviderProps {
  children: React.ReactNode;
}

export const AuthFlowProvider = ({ children }: AuthFlowProviderProps) => {
  const [state, setState] = useState<AuthFlowState>(initialState);

  const value = useMemo<AuthFlowContextValue>(
    () => ({
      ...state,
      setDeployment: (deploymentBaseURL) => {
        setState((s) => ({ ...s, deploymentBaseURL }));
      },
      setOrganizations: ({ email, organizations }) => {
        setState((s) => ({ ...s, email, organizations }));
      },
      selectOrganization: ({ organizationId, organizationName, organizationSubdomain }) => {
        setState((s) => ({ ...s, organizationId, organizationName, organizationSubdomain }));
      },
      reset: () => {
        setState(initialState);
      },
    }),
    [state],
  );

  return <AuthFlowContext.Provider value={value}>{children}</AuthFlowContext.Provider>;
};
