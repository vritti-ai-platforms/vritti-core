import { LocationsDomainService } from '@domain/locations/services/locations.service';
import type { UpdateEnrollmentPurchasingDto } from '@domain/supplier-enrollments/dto/request/update-enrollment-purchasing.dto';
import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import { Injectable } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';

// Enrollments at the legal entity: the purchasing settings name locations, which live in the locations domain, so their
// site is checked here before the enrollment domain applies its own rules
@Injectable()
export class LeSupplierEnrollmentsService {
  constructor(
    private readonly enrollments: SupplierEnrollmentsDomainService,
    private readonly locations: LocationsDomainService,
  ) {}

  // Sets an enrollment's purchasing settings once the locations it names are at the enrollment's site
  async updatePurchasing(dto: UpdateEnrollmentPurchasingDto, leCurrencyCode: string): Promise<SuccessResponseDto> {
    if (dto.quarantineLocationId) {
      await this.locations.assertAtSite(dto.siteId, dto.quarantineLocationId, 'quarantineLocationId');
    }
    if (dto.defaultReceiptLocationId) {
      await this.locations.assertAtSite(dto.siteId, dto.defaultReceiptLocationId, 'defaultReceiptLocationId');
    }
    return this.enrollments.updatePurchasing(dto, leCurrencyCode);
  }
}
