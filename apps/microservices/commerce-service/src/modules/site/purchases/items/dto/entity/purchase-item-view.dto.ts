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
import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';
import type {
  PurchaseItemProgressDisplayDto,
  PurchaseItemProgressInDisplayUnit,
  PurchaseItemSupplierProgressDto,
} from './purchase-item-row.dto';

export class PurchaseItemViewDisplayDto {
  primaryQty: DisplayUomQuantityDto | null;
  allocatedPrimaryQty: DisplayUomQuantityDto | null;
}

export class PurchaseItemViewDto extends PurchaseItemDto {
  categoryName: string;
  taxClassName: string;
  // Whether the item's primary unit can be counted in fractions
  primaryUomAllowDecimal: boolean;
  problems: PurchaseItemProblemDto[];
  // Whether the site's rules buy it only from what the legal entity set up as its suppliers' items
  supplierItemsRequired: boolean;
  display: PurchaseItemViewDisplayDto;

  // Shapes a purchase item for its own page: the item with its category, tax class and what stops it being bought, its
  // quantities also in the item's display unit
  static fromView(row: PurchaseItemViewRow, display: PurchaseItemViewDisplayDto): PurchaseItemViewDto {
    const dto = Object.assign(new PurchaseItemViewDto(), PurchaseItemDto.from(row));
    dto.categoryName = row.categoryName;
    dto.taxClassName = row.taxClassName;
    dto.primaryUomAllowDecimal = row.primaryUomAllowDecimal;
    dto.problems = purchaseItemProblemsOf(row);
    dto.supplierItemsRequired = row.supplierItemsRequired;
    dto.display = display;
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
  suppliers: PurchaseItemSupplierProgressDto[];
  display: PurchaseItemProgressDisplayDto;

  // Shapes how far a purchase item has got in primary units, in all and per supplier, also in the item's display unit
  static from(row: PurchaseItemProgressRow, progress: PurchaseItemProgressInDisplayUnit): PurchaseItemProgressDto {
    const dto = new PurchaseItemProgressDto();
    dto.primaryQty = Number(row.primaryQty);
    dto.allocatedPrimaryQty = row.allocatedPrimaryQty;
    dto.orderedPrimaryQty = row.orderedPrimaryQty;
    dto.inTransitPrimaryQty = row.inTransitPrimaryQty;
    dto.receivedPrimaryQty = row.receivedPrimaryQty;
    dto.invoicedPrimaryQty = row.invoicedPrimaryQty;
    dto.suppliers = progress.suppliers;
    dto.display = progress.display;
    return dto;
  }
}

export class PurchaseItemDocumentDisplayDto {
  primaryQty: DisplayUomQuantityDto | null;
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
  display: PurchaseItemDocumentDisplayDto;

  // Shapes a document line that moves a purchase item, its quantity also in the item's display unit
  static from(row: PurchaseItemDocumentRow, display: PurchaseItemDocumentDisplayDto): PurchaseItemDocumentDto {
    return Object.assign(new PurchaseItemDocumentDto(), row, { display });
  }
}
