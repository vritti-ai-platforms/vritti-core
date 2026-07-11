import { graphql } from '../../gql';

// Relay-connection feed (cache-managed pagination via relayStylePagination on the host cache).
export const GOODS_RECEIPTS_FEED_QUERY = graphql(`
  query GoodsReceiptsFeed($first: Int, $after: String, $search: FeedSearchInput) {
    goodsReceiptsFeed(first: $first, after: $after, search: $search) {
      edges {
        cursor
        node {
          ...GoodsReceiptFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

// Single GR — read cache-only on the detail screen (resolved from the feed-cached entity via the
// Query.goodsReceipt cache redirect on the host).
export const GOODS_RECEIPT_QUERY = graphql(`
  query GoodsReceipt($id: ID!) {
    goodsReceipt(id: $id) {
      ...GoodsReceiptFields
    }
  }
`);
