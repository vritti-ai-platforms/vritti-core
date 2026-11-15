import type { PurchaseRef } from '@/schemas/purchases';

// Why a control of a purchase's document is locked: the purchase owns it
export function purchaseLockTip(purchaseNumber: string): string {
  return `Belongs to purchase ${purchaseNumber} — change it from the purchase.`;
}

// The purchase a document belongs to, as a list; empty for a manual document
export function documentPurchases(document: {
  purchaseId: string | null;
  purchaseNumber: string | null;
}): PurchaseRef[] {
  return document.purchaseId && document.purchaseNumber
    ? [{ id: document.purchaseId, purchaseNumber: document.purchaseNumber }]
    : [];
}
