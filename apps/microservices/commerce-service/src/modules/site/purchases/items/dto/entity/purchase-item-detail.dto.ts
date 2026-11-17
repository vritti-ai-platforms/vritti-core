import type { PurchaseItemTableRowDto } from '@domain/purchase-items/dto/entity/purchase-item-table-row.dto';
import type { PurchaseItemQuoteDto } from './purchase-item-quote.dto';
import type { PurchaseSourcingAllocationDto } from './purchase-sourcing-allocation.dto';

export interface PurchaseItemComparisonDto {
  item: PurchaseItemTableRowDto;
  quotes: PurchaseItemQuoteDto[];
  allocations: PurchaseSourcingAllocationDto[];
}
