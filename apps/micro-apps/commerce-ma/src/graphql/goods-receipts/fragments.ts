import { graphql } from '../../gql';

// Shared field set — reused by the feed + single-item query so every cached GoodsReceipt carries the same
// fields and identity-merges (by id) to keep list/detail in sync.
export const GoodsReceiptFieldsFragment = graphql(`
  fragment GoodsReceiptFields on GoodsReceipt {
    id
    grNumber
    supplierId
    supplierName
    status
    inboundDeliveryId
    deliveryNumber
    deliverySource
    carrier
    trackingNumber
    supplierDeliveryNoteNumber
    supplierDeliveryNoteDate
    poNumbers
    expectedDeliveryDate
    receivedDate
    notes
    publishedAt
    createdAt
  }
`);
