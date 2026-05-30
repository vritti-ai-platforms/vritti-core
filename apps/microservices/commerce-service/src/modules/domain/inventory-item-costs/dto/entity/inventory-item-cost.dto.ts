import { CurrencyAmountDto } from '@vritti/api-sdk';
import type { InventoryItemCost } from '@/db/schema';
import type { CostRowWithCategory } from '../../repositories/inventory-item-costs.repository';
import type { AllocationRow } from '../../repositories/inventory-item-quant-costs.repository';

export class InventoryItemCostDto {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryKind: string;
  totalAmount: CurrencyAmountDto;
  distributionMethod: string;
  vendorRef: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  isLocked: boolean;

  static from(row: CostRowWithCategory, isLocked: boolean): InventoryItemCostDto {
    const dto = new InventoryItemCostDto();
    dto.id = row.id;
    dto.categoryId = row.categoryId;
    dto.categoryName = row.categoryName;
    dto.categoryKind = row.categoryKind;
    dto.totalAmount = CurrencyAmountDto.from(row.totalAmount, row.currencyCode);
    dto.distributionMethod = row.distributionMethod;
    dto.vendorRef = row.vendorRef;
    dto.notes = row.notes;
    dto.createdBy = row.createdBy;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    dto.isLocked = isLocked;
    return dto;
  }
}

export class CostAllocationDto {
  quantId: string;
  locationId: string;
  locationName: string | null;
  lotId: string | null;
  lotNumber: string | null;
  quantity: number;
  allocatedAmount: CurrencyAmountDto;

  static from(row: AllocationRow, currencyCode: string): CostAllocationDto {
    const dto = new CostAllocationDto();
    dto.quantId = row.quantId;
    dto.locationId = row.locationId;
    dto.locationName = row.locationName;
    dto.lotId = row.lotId;
    dto.lotNumber = row.lotNumber;
    dto.quantity = Number(row.quantity);
    dto.allocatedAmount = CurrencyAmountDto.from(row.allocatedAmount, currencyCode);
    return dto;
  }
}

export class CostKindBreakdownEntryDto {
  kind: string;
  amount: CurrencyAmountDto;
  percentage: number;
}

export class CostsForSourceDto {
  costAssociatedAt: string | null;
  totalAmount: CurrencyAmountDto;
  perUnitCost: CurrencyAmountDto;
  kindBreakdown: CostKindBreakdownEntryDto[];
  costRows: { result: InventoryItemCostDto[]; count: number };
}

// Internal helper — exposed only for the service layer; used by createCost / updateCost return paths.
export function costToInsertable(c: InventoryItemCost) {
  return c;
}
