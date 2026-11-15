import type { PurchaseType } from '@/db/schema';
import type { SupplierEnrollmentPurchasingSnapshotRecord } from '../../repositories/supplier-enrollments.repository';

export class SupplierEnrollmentPurchasingSnapshotDto {
  enrollmentId: string;
  isActive: boolean;
  isSupplierActive: boolean;
  purchasingBlocked: boolean;
  purchaseType: PurchaseType;
  approvalEnabled: boolean;
  approvalThreshold: bigint | null;
  qualityCheckEnabled: boolean;
  approverUserIds: string[];

  // Maps the enrollment settings a purchase leg copies when it opens; the threshold stays in minor units
  static from(enrollment: SupplierEnrollmentPurchasingSnapshotRecord): SupplierEnrollmentPurchasingSnapshotDto {
    const dto = new SupplierEnrollmentPurchasingSnapshotDto();
    dto.enrollmentId = enrollment.id;
    dto.isActive = enrollment.isActive;
    dto.isSupplierActive = enrollment.isSupplierActive;
    dto.purchasingBlocked = enrollment.purchasingBlocked;
    dto.purchaseType = enrollment.purchaseType;
    dto.approvalEnabled = enrollment.approvalEnabled;
    dto.approvalThreshold = enrollment.approvalThreshold;
    dto.qualityCheckEnabled = enrollment.qualityCheckEnabled;
    dto.approverUserIds = enrollment.approverUserIds;
    return dto;
  }
}
