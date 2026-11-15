import { PurchaseAllocationDto } from '@domain/purchase-item-allocations/dto/entity/purchase-allocation.dto';
import type { PurchaseAllocationRow } from '@domain/purchase-item-allocations/repositories/purchase-item-allocations.repository';
import { PurchaseItemDto } from '@domain/purchase-items/dto/entity/purchase-item.dto';
import type { PurchaseItemRow } from '@domain/purchase-items/repositories/purchase-items.repository';
import type { PurchaseSupplierRow } from '@domain/purchase-suppliers/repositories/purchase-suppliers.repository';
import type { PurchaseLegStatus, PurchaseLegStep } from '@/db/schema';

export class PurchaseSourcingAllocationDto extends PurchaseAllocationDto {
  supplierId: string;
  supplierName: string;
  legStep: PurchaseLegStep;
  legStatus: PurchaseLegStatus;
  isEditable: boolean;

  // Shapes an allocation with the supplier and state of its leg, and whether it may still change
  static fromAllocation(
    row: PurchaseAllocationRow,
    leg: PurchaseSupplierRow,
    isEditable: boolean,
  ): PurchaseSourcingAllocationDto {
    const dto = Object.assign(new PurchaseSourcingAllocationDto(), PurchaseAllocationDto.from(row));
    dto.supplierId = leg.supplierId;
    dto.supplierName = leg.supplierName;
    dto.legStep = leg.step;
    dto.legStatus = leg.status;
    dto.isEditable = isEditable;
    return dto;
  }
}

export class PurchaseSourcingItemDto extends PurchaseItemDto {
  allocations: PurchaseSourcingAllocationDto[];

  // Shapes a purchase item with its allocations across every leg
  static fromItem(row: PurchaseItemRow, allocations: PurchaseSourcingAllocationDto[]): PurchaseSourcingItemDto {
    const dto = Object.assign(new PurchaseSourcingItemDto(), PurchaseItemDto.from(row));
    dto.allocations = allocations;
    return dto;
  }
}
