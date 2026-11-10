import type { SupplierQuotationDto } from '@domain/supplier-quotations/dto/entity/supplier-quotation.dto';
import { SupplierQuotationsDomainService } from '@domain/supplier-quotations/services/supplier-quotations.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';

@Controller()
export class SupplierEnrollmentQuotationsController {
  private readonly logger = new Logger(SupplierEnrollmentQuotationsController.name);

  constructor(private readonly service: SupplierQuotationsDomainService) {}

  // Returns the supplier's quotations posted to one of the LE's sites
  @MessagePattern({ cmd: 'le.suppliers.enrollments.quotations.table' })
  table(
    @Payload() data: { supplierId: string; siteId: string } & TableState,
  ): Promise<{ result: SupplierQuotationDto[]; count: number }> {
    const { supplierId, siteId, ...state } = data;
    this.logger.log(`le.suppliers.enrollments.quotations.table — supplierId: ${supplierId}, siteId: ${siteId}`);
    return this.service.findForSupplierTable(supplierId, state, siteId);
  }
}
