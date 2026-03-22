import { ConfirmProvider } from '@vritti/quantum-ui/context';
import type { ReactNode } from 'react';

// Wraps feature content with providers needed by quantum-ui components
export const FeatureWrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ConfirmProvider>{children}</ConfirmProvider>
);
