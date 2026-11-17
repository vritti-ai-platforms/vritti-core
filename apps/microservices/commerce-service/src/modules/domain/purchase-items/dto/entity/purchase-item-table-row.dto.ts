import type { PurchaseItemBucket, PurchaseItemSupplierProgress } from '@/db/schema';
import type { PurchaseItemTableRow } from '../../repositories/purchase-items.repository';

export type PurchaseItemFacets = Record<PurchaseItemBucket | 'ALL', number>;

// What needs a buyer's attention on a purchase item before it can be bought
export const PurchaseItemProblemCodeValues = {
  PURCHASING_BLOCKED: 'PURCHASING_BLOCKED',
} as const;
export type PurchaseItemProblemCode =
  (typeof PurchaseItemProblemCodeValues)[keyof typeof PurchaseItemProblemCodeValues];

export interface PurchaseItemProblemDto {
  code: PurchaseItemProblemCode;
  detail: string;
}

// What stops a purchase item being bought: the site having blocked buying it, with why
export function purchaseItemProblemsOf(row: { purchasingBlockedReason: string | null }): PurchaseItemProblemDto[] {
  if (row.purchasingBlockedReason === null) return [];
  return [
    {
      code: PurchaseItemProblemCodeValues.PURCHASING_BLOCKED,
      detail: `Purchasing is blocked at this site: ${row.purchasingBlockedReason}`,
    },
  ];
}

export class PurchaseItemTableRowDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemCode: string;
  categoryName: string;
  primaryUomSymbol: string;
  primaryQty: number;
  allocatedPrimaryQty: number;
  orderedPrimaryQty: number;
  inTransitPrimaryQty: number;
  receivedPrimaryQty: number;
  invoicedPrimaryQty: number;
  quotingSupplierCount: number;
  suppliers: PurchaseItemSupplierProgress[];
  problems: PurchaseItemProblemDto[];
  // Whether the site's rules buy it only from what the legal entity set up as its suppliers' items
  supplierItemsRequired: boolean;
  neededBy: string | null;
  notes: string | null;

  // Shapes a purchase item with how far it has got, who supplies it and what stops it being bought
  static from(row: PurchaseItemTableRow): PurchaseItemTableRowDto {
    const dto = new PurchaseItemTableRowDto();
    dto.id = row.id;
    dto.inventoryItemId = row.inventoryItemId;
    dto.inventoryItemName = row.inventoryItemName;
    dto.inventoryItemCode = row.inventoryItemCode;
    dto.categoryName = row.categoryName;
    dto.primaryUomSymbol = row.primaryUomSymbol;
    dto.primaryQty = row.primaryQty;
    dto.allocatedPrimaryQty = row.allocatedPrimaryQty;
    dto.orderedPrimaryQty = row.orderedPrimaryQty;
    dto.inTransitPrimaryQty = row.inTransitPrimaryQty;
    dto.receivedPrimaryQty = row.receivedPrimaryQty;
    dto.invoicedPrimaryQty = row.invoicedPrimaryQty;
    dto.quotingSupplierCount = row.quotingSupplierCount;
    dto.suppliers = row.suppliers;
    dto.problems = purchaseItemProblemsOf(row);
    dto.supplierItemsRequired = row.supplierItemsRequired;
    dto.neededBy = row.neededBy;
    dto.notes = row.notes;
    return dto;
  }
}
