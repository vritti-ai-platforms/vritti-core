import type { PurchaseItemQuoteDto } from './purchase-item-quote.dto';
import type { PurchaseItemRowDto } from './purchase-item-row.dto';
import type { PurchaseSourcingAllocationDto } from './purchase-sourcing-allocation.dto';

export interface PurchaseItemComparisonDto {
  item: PurchaseItemRowDto;
  quotes: PurchaseItemQuoteDto[];
  allocations: PurchaseSourcingAllocationDto[];
}
