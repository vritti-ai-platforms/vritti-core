import { AuthFlowProvider, useAuthFlow } from './AuthFlowContext';
import { DeploymentSelectionScreen } from './DeploymentSelectionScreen';
import { EmailLookupScreen } from './EmailLookupScreen';
import { LoginScreen } from './LoginScreen';
import { OrgSelectionScreen } from './OrgSelectionScreen';

function AuthFlowContent() {
  const { flow } = useAuthFlow();

  if (flow.step === 'deployment') {
    return <DeploymentSelectionScreen />;
  }

  if (flow.step === 'emailLookup') {
    return <EmailLookupScreen />;
  }

  if (flow.step === 'orgSelection') {
    return <OrgSelectionScreen />;
  }

  return <LoginScreen />;
}

export function AuthFlowShell() {
  return (
    <AuthFlowProvider>
      <AuthFlowContent />
    </AuthFlowProvider>
  );
}
