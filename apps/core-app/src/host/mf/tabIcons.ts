import type { TabIcon } from '@vritti/quantum-ui-native/BottomNavigation';

const defaultIcon: TabIcon = {
  sfSymbol: 'square.stack.3d.up',
  materialSymbol: 'layers',
  materialIcon: 'layers',
};

const commerceTabIcons: Record<string, TabIcon> = {
  BOM: { sfSymbol: 'chart.bar.doc.horizontal', materialSymbol: 'account_tree', materialIcon: 'account-tree' },
  './BOM': { sfSymbol: 'chart.bar.doc.horizontal', materialSymbol: 'account_tree', materialIcon: 'account-tree' },
  Categories: { sfSymbol: 'rectangle.grid.2x2', materialSymbol: 'category', materialIcon: 'category' },
  './Categories': { sfSymbol: 'rectangle.grid.2x2', materialSymbol: 'category', materialIcon: 'category' },
  Conversions: { sfSymbol: 'arrow.2.squarepath', materialSymbol: 'sync_alt', materialIcon: 'sync-alt' },
  './Conversions': { sfSymbol: 'arrow.2.squarepath', materialSymbol: 'sync_alt', materialIcon: 'sync-alt' },
  CreditNotes: { sfSymbol: 'at.badge.minus', materialSymbol: 'note_alt', materialIcon: 'note-alt' },
  './CreditNotes': { sfSymbol: 'at.badge.minus', materialSymbol: 'note_alt', materialIcon: 'note-alt' },
  Customers: { sfSymbol: 'person.2', materialSymbol: 'people', materialIcon: 'people' },
  './Customers': { sfSymbol: 'person.2', materialSymbol: 'people', materialIcon: 'people' },
  GoodsReceipts: { sfSymbol: 'shippingbox.and.arrow.backward', materialSymbol: 'move_to_inbox', materialIcon: 'move-to-inbox' },
  './GoodsReceipts': { sfSymbol: 'shippingbox.and.arrow.backward', materialSymbol: 'move_to_inbox', materialIcon: 'move-to-inbox' },
  InventoryItems: { sfSymbol: 'archivebox', materialSymbol: 'inventory', materialIcon: 'inventory' },
  './InventoryItems': { sfSymbol: 'archivebox', materialSymbol: 'inventory', materialIcon: 'inventory' },
  StorageLocations: { sfSymbol: 'building.2', materialSymbol: 'warehouse', materialIcon: 'warehouse' },
  './StorageLocations': { sfSymbol: 'building.2', materialSymbol: 'warehouse', materialIcon: 'warehouse' },
  Invoices: { sfSymbol: 'doc.text', materialSymbol: 'receipt', materialIcon: 'receipt' },
  './Invoices': { sfSymbol: 'doc.text', materialSymbol: 'receipt', materialIcon: 'receipt' },
  Items: { sfSymbol: 'square.grid.2x2', materialSymbol: 'grid_view', materialIcon: 'grid-view' },
  './Items': { sfSymbol: 'square.grid.2x2', materialSymbol: 'grid_view', materialIcon: 'grid-view' },
  Modifiers: { sfSymbol: 'slider.horizontal.3', materialSymbol: 'tune', materialIcon: 'tune' },
  './Modifiers': { sfSymbol: 'slider.horizontal.3', materialSymbol: 'tune', materialIcon: 'tune' },
  Orders: { sfSymbol: 'bag', materialSymbol: 'shopping_bag', materialIcon: 'shopping-bag' },
  './Orders': { sfSymbol: 'bag', materialSymbol: 'shopping_bag', materialIcon: 'shopping-bag' },
  POSTerminals: { sfSymbol: 'desktopcomputer', materialSymbol: 'computer', materialIcon: 'computer' },
  './POSTerminals': { sfSymbol: 'desktopcomputer', materialSymbol: 'computer', materialIcon: 'computer' },
  POSBilling: { sfSymbol: 'cart', materialSymbol: 'shopping_cart', materialIcon: 'shopping-cart' },
  './POSBilling': { sfSymbol: 'cart', materialSymbol: 'shopping_cart', materialIcon: 'shopping-cart' },
  PriceLists: { sfSymbol: 'list.bullet.rectangle', materialSymbol: 'list_alt', materialIcon: 'list-alt' },
  './PriceLists': { sfSymbol: 'list.bullet.rectangle', materialSymbol: 'list_alt', materialIcon: 'list-alt' },
  PurchaseOrders: { sfSymbol: 'cart.badge.plus', materialSymbol: 'add_shopping_cart', materialIcon: 'add-shopping-cart' },
  './PurchaseOrders': { sfSymbol: 'cart.badge.plus', materialSymbol: 'add_shopping_cart', materialIcon: 'add-shopping-cart' },
  StockAdjustments: { sfSymbol: 'plusminus.circle', materialSymbol: 'manage_history', materialIcon: 'manage-history' },
  './StockAdjustments': { sfSymbol: 'plusminus.circle', materialSymbol: 'manage_history', materialIcon: 'manage-history' },
  StockTransfers: { sfSymbol: 'arrow.left.arrow.right', materialSymbol: 'swap_horiz', materialIcon: 'swap-horiz' },
  './StockTransfers': { sfSymbol: 'arrow.left.arrow.right', materialSymbol: 'swap_horiz', materialIcon: 'swap-horiz' },
  Suppliers: { sfSymbol: 'truck.box', materialSymbol: 'local_shipping', materialIcon: 'local-shipping' },
  './Suppliers': { sfSymbol: 'truck.box', materialSymbol: 'local_shipping', materialIcon: 'local-shipping' },
  TaxGroups: { sfSymbol: 'percent', materialSymbol: 'percent', materialIcon: 'percent' },
  './TaxGroups': { sfSymbol: 'percent', materialSymbol: 'percent', materialIcon: 'percent' },
  UOM: { sfSymbol: 'ruler', materialSymbol: 'straighten', materialIcon: 'straighten' },
  './UOM': { sfSymbol: 'ruler', materialSymbol: 'straighten', materialIcon: 'straighten' },
};

export const getCommerceTabIcon = (key: string): TabIcon => {
  return commerceTabIcons[key] ?? defaultIcon;
};
