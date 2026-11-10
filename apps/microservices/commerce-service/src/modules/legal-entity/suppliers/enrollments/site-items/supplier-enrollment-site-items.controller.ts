import type { SupplierSiteItemRowDto } from '@domain/supplier-items/dto/entity/supplier-site-item-row.dto';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';

@Controller()
export class SupplierEnrollmentSiteItemsController {
  private readonly logger = new Logger(SupplierEnrollmentSiteItemsController.name);

  constructor(private readonly service: SupplierItemsDomainService) {}

  // Returns a supplier's site items at one of the LE's sites, with that site's terms and price in force
  @MessagePattern({ cmd: 'le.suppliers.enrollments.siteItems.table' })
  table(
    @Payload() data: { supplierId: string; siteId: string } & TableState,
  ): Promise<{ result: SupplierSiteItemRowDto[]; count: number }> {
    const { supplierId, siteId, ...state } = data;
    this.logger.log(`le.suppliers.enrollments.siteItems.table — supplierId: ${supplierId}, siteId: ${siteId}`);
    return this.service.findSiteItemsAtSiteForTable(supplierId, siteId, state);
  }
}
