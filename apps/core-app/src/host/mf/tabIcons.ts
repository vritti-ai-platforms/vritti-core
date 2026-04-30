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
  POSTerminals: { sfSymbol: 'desktopcomputer' },
  './POSTerminals': { sfSymbol: 'desktopcomputer' },
  PriceLists: { sfSymbol: 'list.bullet.rectangle' },
  './PriceLists': { sfSymbol: 'list.bullet.rectangle' },
  POSBilling: { sfSymbol: 'cart' },
  './POSBilling': { sfSymbol: 'cart' },
};

export function getCommerceTabIcon(key: string): TabIcon {
  return commerceTabIcons[key] ?? defaultIcon;
}
