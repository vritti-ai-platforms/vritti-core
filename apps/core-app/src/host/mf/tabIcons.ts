import type { TabIcon } from '@vritti/quantum-ui-native/BottomNavigation';

const defaultIcon: TabIcon = {
  sfSymbol: 'square.stack.3d.up',
  materialSymbol: 'layers',
};

const commerceTabIcons: Record<string, TabIcon> = {
  Items: { sfSymbol: 'square.grid.2x2', materialSymbol: 'grid_view' },
  './Items': { sfSymbol: 'square.grid.2x2', materialSymbol: 'grid_view' },
  Categories: { sfSymbol: 'rectangle.grid.2x2', materialSymbol: 'category' },
  './Categories': { sfSymbol: 'rectangle.grid.2x2', materialSymbol: 'category' },
  Modifiers: { sfSymbol: 'slider.horizontal.3', materialSymbol: 'tune' },
  './Modifiers': { sfSymbol: 'slider.horizontal.3', materialSymbol: 'tune' },
  POSTerminals: { sfSymbol: 'desktopcomputer', materialSymbol: 'computer' },
  './POSTerminals': { sfSymbol: 'desktopcomputer', materialSymbol: 'computer' },
  PriceLists: { sfSymbol: 'list.bullet.rectangle', materialSymbol: 'list_alt' },
  './PriceLists': { sfSymbol: 'list.bullet.rectangle', materialSymbol: 'list_alt' },
  POSBilling: { sfSymbol: 'cart', materialSymbol: 'shopping_cart' },
  './POSBilling': { sfSymbol: 'cart', materialSymbol: 'shopping_cart' },
};

export const getCommerceTabIcon = (key: string): TabIcon => {
  return commerceTabIcons[key] ?? defaultIcon;
};
