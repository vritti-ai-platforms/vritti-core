import type { TabIcon } from '@vritti/quantum-ui-native/BottomNavigation';

const defaultIcon: TabIcon = {
  sfSymbol: 'square.stack.3d.up',
  materialSymbol: 'layers',
};

const commerceTabIcons: Record<string, TabIcon> = {
  BOM: { sfSymbol: 'chart.bar.doc.horizontal', materialSymbol: 'account_tree' },
  './BOM': { sfSymbol: 'chart.bar.doc.horizontal', materialSymbol: 'account_tree' },
  Categories: { sfSymbol: 'rectangle.grid.2x2', materialSymbol: 'category' },
  './Categories': { sfSymbol: 'rectangle.grid.2x2', materialSymbol: 'category' },
  Conversions: { sfSymbol: 'arrow.2.squarepath', materialSymbol: 'sync_alt' },
  './Conversions': { sfSymbol: 'arrow.2.squarepath', materialSymbol: 'sync_alt' },
  CreditNotes: { sfSymbol: 'at.badge.minus', materialSymbol: 'note_alt' },
  './CreditNotes': { sfSymbol: 'at.badge.minus', materialSymbol: 'note_alt' },
  Customers: { sfSymbol: 'person.2', materialSymbol: 'people' },
  './Customers': { sfSymbol: 'person.2', materialSymbol: 'people' },
  GoodsReceipts: { sfSymbol: 'shippingbox.and.arrow.backward', materialSymbol: 'move_to_inbox' },
  './GoodsReceipts': { sfSymbol: 'shippingbox.and.arrow.backward', materialSymbol: 'move_to_inbox' },
  InventoryItems: { sfSymbol: 'archivebox', materialSymbol: 'inventory' },
  './InventoryItems': { sfSymbol: 'archivebox', materialSymbol: 'inventory' },
  StorageLocations: { sfSymbol: 'building.2', materialSymbol: 'warehouse' },
  './StorageLocations': { sfSymbol: 'building.2', materialSymbol: 'warehouse' },
  Invoices: { sfSymbol: 'doc.text', materialSymbol: 'receipt' },
  './Invoices': { sfSymbol: 'doc.text', materialSymbol: 'receipt' },
  Items: { sfSymbol: 'square.grid.2x2', materialSymbol: 'grid_view' },
  './Items': { sfSymbol: 'square.grid.2x2', materialSymbol: 'grid_view' },
  Modifiers: { sfSymbol: 'slider.horizontal.3', materialSymbol: 'tune' },
  './Modifiers': { sfSymbol: 'slider.horizontal.3', materialSymbol: 'tune' },
  Orders: { sfSymbol: 'bag', materialSymbol: 'shopping_bag' },
  './Orders': { sfSymbol: 'bag', materialSymbol: 'shopping_bag' },
  POSTerminals: { sfSymbol: 'desktopcomputer', materialSymbol: 'computer' },
  './POSTerminals': { sfSymbol: 'desktopcomputer', materialSymbol: 'computer' },
  POSBilling: { sfSymbol: 'cart', materialSymbol: 'shopping_cart' },
  './POSBilling': { sfSymbol: 'cart', materialSymbol: 'shopping_cart' },
  PriceLists: { sfSymbol: 'list.bullet.rectangle', materialSymbol: 'list_alt' },
  './PriceLists': { sfSymbol: 'list.bullet.rectangle', materialSymbol: 'list_alt' },
  PurchaseOrders: { sfSymbol: 'cart.badge.plus', materialSymbol: 'add_shopping_cart' },
  './PurchaseOrders': { sfSymbol: 'cart.badge.plus', materialSymbol: 'add_shopping_cart' },
  StockAdjustments: { sfSymbol: 'plusminus.circle', materialSymbol: 'manage_history' },
  './StockAdjustments': { sfSymbol: 'plusminus.circle', materialSymbol: 'manage_history' },
  StockTransfers: { sfSymbol: 'arrow.left.arrow.right', materialSymbol: 'swap_horiz' },
  './StockTransfers': { sfSymbol: 'arrow.left.arrow.right', materialSymbol: 'swap_horiz' },
  Suppliers: { sfSymbol: 'truck.box', materialSymbol: 'local_shipping' },
  './Suppliers': { sfSymbol: 'truck.box', materialSymbol: 'local_shipping' },
  TaxGroups: { sfSymbol: 'percent', materialSymbol: 'percent' },
  './TaxGroups': { sfSymbol: 'percent', materialSymbol: 'percent' },
  UOM: { sfSymbol: 'ruler', materialSymbol: 'straighten' },
  './UOM': { sfSymbol: 'ruler', materialSymbol: 'straighten' },
};

export const getCommerceTabIcon = (key: string): TabIcon => {
  return commerceTabIcons[key] ?? defaultIcon;
};
