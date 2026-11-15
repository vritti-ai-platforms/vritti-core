import type { SupplierEnrollmentDetailRecord } from '../../repositories/supplier-enrollments.repository';
import type { EnrollmentPurchasingDto } from './enrollment-purchasing.dto';
import { SupplierEnrollmentDetailDto } from './supplier-enrollment-detail.dto';

export class SupplierEnrollmentPurchasingDetailDto extends SupplierEnrollmentDetailDto {
  purchasing: EnrollmentPurchasingDto | null;

  // Maps one (supplier, site) pair with the enrollment's purchasing settings, null when the supplier is not enrolled
  static fromPurchasing(
    row: SupplierEnrollmentDetailRecord,
    purchasing: EnrollmentPurchasingDto | null,
  ): SupplierEnrollmentPurchasingDetailDto {
    const dto = new SupplierEnrollmentPurchasingDetailDto();
    Object.assign(dto, SupplierEnrollmentDetailDto.fromDetail(row));
    dto.purchasing = purchasing;
    return dto;
  }
}
