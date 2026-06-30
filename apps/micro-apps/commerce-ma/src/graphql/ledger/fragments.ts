import { graphql } from '../../gql';

// Shared field set for an inventory item's ledger entries (stock movement journal).
export const LedgerEntryFieldsFragment = graphql(`
  fragment LedgerEntryFields on InventoryItemLedgerEntry {
    id
    type
    quantity
    balanceAfter
    referenceType
    referenceId
    notes
    createdAt
  }
`);
