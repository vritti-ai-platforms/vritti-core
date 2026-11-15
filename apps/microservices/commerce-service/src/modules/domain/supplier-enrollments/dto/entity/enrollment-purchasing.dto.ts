import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { PurchaseType } from '@/db/schema';
import type { SupplierEnrollmentPurchasingRecord } from '../../repositories/supplier-enrollments.repository';

export class EnrollmentPurchasingDto {
  purchaseType: PurchaseType;
  approvalEnabled: boolean;
  approverUserIds: string[];
  approvalThreshold: CurrencyAmountDto;
  qualityCheckEnabled: boolean;
  quarantineLocationId: string | null;
  quarantineLocationName: string | null;
  defaultReceiptLocationId: string | null;
  defaultReceiptLocationName: string | null;
  priceTolerancePct: number;
  qtyTolerancePct: number;
  amountTolerance: CurrencyAmountDto;

  // Maps an enrollment's purchasing settings, its amounts in the legal entity's currency (no threshold reads as zero,
  // every leg); the gateway names the approvers
  static from(row: SupplierEnrollmentPurchasingRecord, leCurrencyCode: string): EnrollmentPurchasingDto {
    const dto = new EnrollmentPurchasingDto();
    dto.purchaseType = row.purchaseType;
    dto.approvalEnabled = row.approvalEnabled;
    dto.approverUserIds = row.approverUserIds;
    dto.approvalThreshold = CurrencyAmountDto.from(row.approvalThreshold ?? 0n, leCurrencyCode);
    dto.qualityCheckEnabled = row.qualityCheckEnabled;
    dto.quarantineLocationId = row.quarantineLocationId;
    dto.quarantineLocationName = row.quarantineLocationName;
    dto.defaultReceiptLocationId = row.defaultReceiptLocationId;
    dto.defaultReceiptLocationName = row.defaultReceiptLocationName;
    dto.priceTolerancePct = row.priceTolerancePct;
    dto.qtyTolerancePct = row.qtyTolerancePct;
    dto.amountTolerance = CurrencyAmountDto.from(row.amountTolerance, leCurrencyCode);
    return dto;
  }
}
