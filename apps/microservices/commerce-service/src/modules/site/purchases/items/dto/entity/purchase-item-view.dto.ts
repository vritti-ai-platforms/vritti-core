import { PurchaseItemDto } from '@domain/purchase-items/dto/entity/purchase-item.dto';
import {
  type PurchaseItemProblemDto,
  purchaseItemProblemsOf,
} from '@domain/purchase-items/dto/entity/purchase-item-table-row.dto';
import type {
  PurchaseItemCountsRow,
  PurchaseItemDocumentRow,
  PurchaseItemProgressRow,
  PurchaseItemViewRow,
} from '@domain/purchase-items/repositories/purchase-items.repository';
import type { PurchaseItemSupplierProgress } from '@/db/schema';

export class PurchaseItemViewDto extends PurchaseItemDto {
  categoryName: string;
  taxClassName: string;
  // Whether the item's primary unit can be counted in fractions
  primaryUomAllowDecimal: boolean;
  problems: PurchaseItemProblemDto[];
  // Whether the site's rules buy it only from what the legal entity set up as its suppliers' items
  supplierItemsRequired: boolean;

  // Shapes a purchase item for its own page: the item with its category, tax class and what stops it being bought
  static fromView(row: PurchaseItemViewRow): PurchaseItemViewDto {
    const dto = Object.assign(new PurchaseItemViewDto(), PurchaseItemDto.from(row));
    dto.categoryName = row.categoryName;
    dto.taxClassName = row.taxClassName;
    dto.primaryUomAllowDecimal = row.primaryUomAllowDecimal;
    dto.problems = purchaseItemProblemsOf(row);
    dto.supplierItemsRequired = row.supplierItemsRequired;
    return dto;
  }
}

export class PurchaseItemCountsDto {
  allocationCount: number;
  quoteCount: number;
  documentCount: number;

  // Shapes the counts a purchase item's page labels its tabs with
  static from(row: PurchaseItemCountsRow): PurchaseItemCountsDto {
    const dto = new PurchaseItemCountsDto();
    dto.allocationCount = Number(row.allocationCount);
    dto.quoteCount = Number(row.quoteCount);
    dto.documentCount = Number(row.documentCount);
    return dto;
  }
}

export class PurchaseItemProgressDto {
  primaryQty: number;
  allocatedPrimaryQty: number;
  orderedPrimaryQty: number;
  inTransitPrimaryQty: number;
  receivedPrimaryQty: number;
  invoicedPrimaryQty: number;
  suppliers: PurchaseItemSupplierProgress[];

  // Shapes how far a purchase item has got in primary units, in all and per supplier
  static from(row: PurchaseItemProgressRow): PurchaseItemProgressDto {
    const dto = new PurchaseItemProgressDto();
    dto.primaryQty = Number(row.primaryQty);
    dto.allocatedPrimaryQty = row.allocatedPrimaryQty;
    dto.orderedPrimaryQty = row.orderedPrimaryQty;
    dto.inTransitPrimaryQty = row.inTransitPrimaryQty;
    dto.receivedPrimaryQty = row.receivedPrimaryQty;
    dto.invoicedPrimaryQty = row.invoicedPrimaryQty;
    dto.suppliers = row.suppliers;
    return dto;
  }
}

export class PurchaseItemDocumentDto {
  lineId: string;
  type: PurchaseItemDocumentRow['type'];
  documentId: string;
  documentNumber: string;
  status: string;
  date: string;
  supplierId: string;
  supplierName: string;
  primaryQty: number;

  static from(row: PurchaseItemDocumentRow): PurchaseItemDocumentDto {
    return Object.assign(new PurchaseItemDocumentDto(), row);
  }
}
