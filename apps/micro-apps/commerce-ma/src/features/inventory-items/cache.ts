import { registerConnection } from "@vritti/quantum-ui-native/apollo";

// Register this micro-app's cache policies on the host's shared Apollo cache: relayStylePagination on
// the `inventoryItems` feed connection + a by-id read redirect for `inventoryItem`. Imported for its
// side effect by the feature entry (index.tsx) so it runs once at module eval — this is the MF-exposed
// feature the host lazily imports, so it executes before any screen here mounts or queries. The host
// cache stays schema-agnostic; these policies are present for the first read (registering in a
// hook/effect would be too late and miss the page-1 relay merge).
registerConnection({
  field: "inventoryItems",
  keyArgs: ["filters", "search", "sort"],
  singleField: "inventoryItem",
  typename: "InventoryItem",
});
