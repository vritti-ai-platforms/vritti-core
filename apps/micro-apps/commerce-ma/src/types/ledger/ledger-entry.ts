// A stock movement journal entry for an inventory item (mirrors the InventoryItemLedgerEntry GraphQL type).
// `quantity` is signed (inflow > 0, outflow < 0); `balanceAfter` is null — the feed has no running balance.
export interface LedgerEntry {
  id: string;
  type: string;
  quantity: number;
  balanceAfter: number | null;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
}
