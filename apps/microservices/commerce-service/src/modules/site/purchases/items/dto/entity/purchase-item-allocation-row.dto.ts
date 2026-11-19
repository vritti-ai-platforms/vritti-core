import type { PurchaseItemAllocationTableRow } from '@domain/purchase-item-allocations/repositories/purchase-item-allocations.repository';
import type { PurchaseSupplierRow } from '@domain/purchase-suppliers/repositories/purchase-suppliers.repository';
import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';
import type { PurchaseOrderStatus } from '@/db/schema';
import { PurchaseSourcingAllocationDto } from './purchase-sourcing-allocation.dto';

export class PurchaseItemAllocationRowDisplayDto {
  primaryUomQty: DisplayUomQuantityDto | null;
  receivedPrimaryQty: DisplayUomQuantityDto | null;
  invoicedPrimaryQty: DisplayUomQuantityDto | null;
}

export class PurchaseItemAllocationRowDto extends PurchaseSourcingAllocationDto {
  poNumber: string | null;
  poStatus: PurchaseOrderStatus | null;
  receivedPrimaryQty: number | null;
  invoicedPrimaryQty: number | null;
  display: PurchaseItemAllocationRowDisplayDto;

  // Shapes an allocation of a purchase item with its leg, the PO it became and how far that got, its primary-unit
  // quantities also in the item's display unit
  static fromRow(
    row: PurchaseItemAllocationTableRow,
    leg: PurchaseSupplierRow,
    isEditable: boolean,
    display: PurchaseItemAllocationRowDisplayDto,
  ): PurchaseItemAllocationRowDto {
    const dto = Object.assign(
      new PurchaseItemAllocationRowDto(),
      PurchaseSourcingAllocationDto.fromAllocation(row, leg, isEditable),
    );
    dto.poNumber = row.poNumber;
    dto.poStatus = row.poStatus;
    dto.receivedPrimaryQty = row.receivedPrimaryQty;
    dto.invoicedPrimaryQty = row.invoicedPrimaryQty;
    dto.display = display;
    return dto;
  }
}
