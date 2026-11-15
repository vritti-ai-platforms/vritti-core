import type { PurchaseHeaderRow } from '../../repositories/purchases.repository';
import { type PurchaseAction, PurchaseDto } from './purchase.dto';
import { type PurchaseProgress, purchaseProgress } from './purchase-table-row.dto';

export interface PurchaseHeaderDetails {
  quotationCount: number;
  availableActions: PurchaseAction[];
}

export class PurchaseHeaderDto extends PurchaseDto {
  itemCount: number;
  quotationCount: number;
  supplierCount: number;
  cancelReason: string | null;
  progress: PurchaseProgress;
  availableActions: PurchaseAction[];

  // Shapes a purchase with its item, quotation and supplier counts, its progress through its step and the actions it offers
  static fromHeader(row: PurchaseHeaderRow, details: PurchaseHeaderDetails): PurchaseHeaderDto {
    const dto = Object.assign(new PurchaseHeaderDto(), PurchaseDto.from(row));
    dto.itemCount = row.itemCount;
    dto.quotationCount = details.quotationCount;
    dto.supplierCount = row.supplierCount;
    dto.cancelReason = row.cancelReason;
    dto.progress = purchaseProgress(row);
    dto.availableActions = details.availableActions;
    return dto;
  }
}
