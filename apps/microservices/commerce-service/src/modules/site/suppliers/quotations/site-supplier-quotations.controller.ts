import type {
  SupplierQuotationDetailDto,
  SupplierQuotationDto,
} from '@domain/supplier-quotations/dto/entity/supplier-quotation.dto';
import { SupplierQuotationsDomainService } from '@domain/supplier-quotations/services/supplier-quotations.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { RpcSiteId } from '@vritti/api-sdk/nats';

@Controller()
export class SiteSupplierQuotationsController {
  private readonly logger = new Logger(SiteSupplierQuotationsController.name);

  constructor(private readonly service: SupplierQuotationsDomainService) {}

  // Returns the supplier's quotations posted to the caller's site
  @MessagePattern({ cmd: 'site.suppliers.quotations.table' })
  table(
    @Payload() data: { supplierId: string } & TableState,
    @RpcSiteId() siteId: string,
  ): Promise<{ result: SupplierQuotationDto[]; count: number }> {
    const { supplierId, ...state } = data;
    this.logger.log(`site.suppliers.quotations.table — supplierId: ${supplierId}`);
    return this.service.findForSupplierTable(supplierId, state, siteId);
  }

  // Returns a quotation of the supplier only when it is posted to the caller's site
  @MessagePattern({ cmd: 'site.suppliers.quotations.findById' })
  findById(
    @Payload() data: { supplierId: string; quotationId: string },
    @RpcSiteId() siteId: string,
  ): Promise<SupplierQuotationDetailDto> {
    this.logger.log(`site.suppliers.quotations.findById — supplierId: ${data.supplierId}, id: ${data.quotationId}`);
    return this.service.findDetailAtSite(data.supplierId, data.quotationId, siteId);
  }
}
