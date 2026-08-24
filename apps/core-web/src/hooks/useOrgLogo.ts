import { useTheme } from '@vritti/quantum-ui/hooks';
import { useAuth } from '../providers/AuthProvider';

// Returns the org logo matching the active theme, or null when the org has none
export function useOrgLogo(): string | null {
  const { theme } = useTheme();
  const { org } = useAuth();
  return (theme === 'dark' ? org?.logoDarkUrl : org?.logoLightUrl) ?? null;
}
