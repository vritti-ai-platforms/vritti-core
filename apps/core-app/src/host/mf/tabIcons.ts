import type { TabIcon } from '@vritti/quantum-ui-native/BottomNavigation';

const defaultIcon: TabIcon = {
  sfSymbol: 'square.stack.3d.up',
};

const commerceTabIcons: Record<string, TabIcon> = {
  Items: { sfSymbol: 'square.grid.2x2' },
  './Items': { sfSymbol: 'square.grid.2x2' },
  Categories: { sfSymbol: 'rectangle.grid.2x2' },
  './Categories': { sfSymbol: 'rectangle.grid.2x2' },
  Modifiers: { sfSymbol: 'slider.horizontal.3' },
  './Modifiers': { sfSymbol: 'slider.horizontal.3' },
};

export function getCommerceTabIcon(key: string): TabIcon {
  return commerceTabIcons[key] ?? defaultIcon;
}
