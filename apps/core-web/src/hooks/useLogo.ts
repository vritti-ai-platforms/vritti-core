import { useTheme } from '@vritti/quantum-ui/hooks';

import coreDark from '../assets/vritti_core_dark.svg';
import coreLight from '../assets/vritti_core_light.svg';

// Returns the correct logo SVG based on theme
export function useLogo(): string {
  const { theme } = useTheme();
  return theme === 'dark' ? coreDark : coreLight;
}
