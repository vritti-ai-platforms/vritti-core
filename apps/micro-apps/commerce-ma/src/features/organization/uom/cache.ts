import { registerConnection, registerTypePolicies } from '@vritti/quantum-ui-native/apollo';

// Register a by-id read redirect for the single-dimension query so the detail screen reads a dimension
// straight from the normalized cache (populated by the list). The dimensions list is a plain array (no
// relay connection). Runs at module eval (side-effect import from index.tsx), before any screen queries —
// a policy added after a field's first read is ignored.
registerTypePolicies({
  Query: {
    fields: {
      uomDimension: {
        read(_existing, { args, toReference }) {
          const id = args?.id as string | undefined;
          return id ? toReference({ __typename: 'UomDimension', id }) : undefined;
        },
      },
    },
  },
});

// The units feed is a Relay connection keyed per-dimension (relayStylePagination merges pages), plus a
// by-id read redirect for the single-unit query (post-update re-fetch source).
registerConnection({
  field: 'uomsFeed',
  keyArgs: ['dimensionId'],
  singleField: 'uom',
  typename: 'Uom',
});
