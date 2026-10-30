import {
  type EnrollmentPicks,
  SupplierSitesDomainService,
} from '@domain/supplier-sites/services/supplier-sites.service';
import { Injectable, Logger } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class SiteSuppliersService {
  private readonly logger = new Logger(SiteSuppliersService.name);

  constructor(private readonly supplierSitesService: SupplierSitesDomainService) {}

  // Updates the caller site's picks for a supplier, creating its enrollment first when the site has none
  updateEnrollment(supplierId: string, siteId: string, data: EnrollmentPicks): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.updateEnrollment — supplierId: ${supplierId}`);
    return this.supplierSitesService.updateForSite(supplierId, siteId, data);
  }

  // Removes the caller site's enrollment of a supplier
  unenroll(supplierId: string, siteId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.unenroll — supplierId: ${supplierId}`);
    return this.supplierSitesService.unenrollForSite(supplierId, siteId);
  }
}
