import { useTheme } from '@vritti/quantum-ui/hooks';

import vapDark from '../assets/vap_dark.svg';
import vapLight from '../assets/vap_light.svg';

// Returns the correct logo SVG based on theme
export function useLogo(): string {
  const { theme } = useTheme();
  return theme === 'dark' ? vapDark : vapLight;
}
