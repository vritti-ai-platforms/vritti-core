import { registerConnection } from '@vritti/quantum-ui-native/apollo';

// relayStylePagination on the goodsReceiptsFeed connection (keyed by `search`; first/after excluded so
// pages merge) + a by-id read redirect for goodsReceipt (so the detail resolves cache-only from the
// feed-cached entity). Imported for its side effect by the feature entry (index.tsx) so it runs once at
// module eval — before any screen here mounts or queries.
registerConnection({
  field: 'goodsReceiptsFeed',
  keyArgs: ['search'],
  singleField: 'goodsReceipt',
  typename: 'GoodsReceipt',
});
