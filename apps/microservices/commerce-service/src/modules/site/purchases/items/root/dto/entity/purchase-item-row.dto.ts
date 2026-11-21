import { PurchaseItemTableRowDto } from '@domain/purchase-items/dto/entity/purchase-item-table-row.dto';
import type { PurchaseItemTableRow } from '@domain/purchase-items/repositories/purchase-items.repository';
import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';
import type { PurchaseItemSupplierProgress } from '@/db/schema';

export class PurchaseItemProgressDisplayDto {
  primaryQty: DisplayUomQuantityDto | null;
  allocatedPrimaryQty: DisplayUomQuantityDto | null;
  orderedPrimaryQty: DisplayUomQuantityDto | null;
  inTransitPrimaryQty: DisplayUomQuantityDto | null;
  receivedPrimaryQty: DisplayUomQuantityDto | null;
  invoicedPrimaryQty: DisplayUomQuantityDto | null;
}

export class PurchaseItemSupplierProgressDisplayDto {
  allocated: DisplayUomQuantityDto | null;
  ordered: DisplayUomQuantityDto | null;
  inTransit: DisplayUomQuantityDto | null;
  received: DisplayUomQuantityDto | null;
  invoiced: DisplayUomQuantityDto | null;
}

export class PurchaseItemSupplierProgressDto {
  legId: string;
  supplierId: string;
  supplierName: string;
  allocated: number;
  ordered: number;
  inTransit: number;
  received: number;
  invoiced: number;
  display: PurchaseItemSupplierProgressDisplayDto;

  // Shapes how far one supplier's share of a purchase item has got, each quantity also in the item's display unit
  static from(
    progress: PurchaseItemSupplierProgress,
    display: PurchaseItemSupplierProgressDisplayDto,
  ): PurchaseItemSupplierProgressDto {
    return Object.assign(new PurchaseItemSupplierProgressDto(), progress, { display });
  }
}

export interface PurchaseItemProgressInDisplayUnit {
  display: PurchaseItemProgressDisplayDto;
  suppliers: PurchaseItemSupplierProgressDto[];
}

export class PurchaseItemRowDto extends PurchaseItemTableRowDto {
  declare suppliers: PurchaseItemSupplierProgressDto[];
  display: PurchaseItemProgressDisplayDto;

  // Shapes a purchase item row with how far it has got, in all and per supplier, also in the item's display unit
  static fromRow(row: PurchaseItemTableRow, progress: PurchaseItemProgressInDisplayUnit): PurchaseItemRowDto {
    const dto = Object.assign(new PurchaseItemRowDto(), PurchaseItemTableRowDto.from(row));
    dto.suppliers = progress.suppliers;
    dto.display = progress.display;
    return dto;
  }
}
