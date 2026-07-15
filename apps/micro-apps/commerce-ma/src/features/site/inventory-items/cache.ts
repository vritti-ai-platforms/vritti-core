import { registerConnection } from '@vritti/quantum-ui-native/apollo';

// Register this micro-app's cache policies on the host's shared Apollo cache: relayStylePagination on
// the `inventoryItems` feed connection + a by-id read redirect for `inventoryItem`. Imported for its
// side effect by the feature entry (index.tsx) so it runs once at module eval — this is the MF-exposed
// feature the host lazily imports, so it executes before any screen here mounts or queries. The host
// cache stays schema-agnostic; these policies are present for the first read (registering in a
// hook/effect would be too late and miss the page-1 relay merge).
registerConnection({
  field: 'inventoryItems',
  keyArgs: ['filters', 'search', 'sort'],
  singleField: 'inventoryItem',
  typename: 'InventoryItem',
});

// Per-item stock-levels feed — relayStylePagination keyed by inventoryItemId so each item's connection is
// cached separately (first/after are excluded so pages merge). Read-only, so no single-item read redirect.
registerConnection({
  field: 'inventoryItemStockLevels',
  keyArgs: ['inventoryItemId'],
});

// Per-item locations feed — same per-item relay connection; create/delete patch it via cache surgery.
registerConnection({
  field: 'inventoryItemLocations',
  keyArgs: ['inventoryItemId'],
});

// Per-item suppliers feed — read-only per-item relay connection, keyed by inventoryItemId.
registerConnection({
  field: 'inventoryItemSuppliers',
  keyArgs: ['inventoryItemId'],
});

// Per-item quants feed — read-only per-item relay connection, keyed by inventoryItemId.
registerConnection({
  field: 'inventoryItemQuants',
  keyArgs: ['inventoryItemId'],
});

// Per-item ledger feed — read-only per-item relay connection, keyed by inventoryItemId.
registerConnection({
  field: 'inventoryItemLedger',
  keyArgs: ['inventoryItemId'],
});
