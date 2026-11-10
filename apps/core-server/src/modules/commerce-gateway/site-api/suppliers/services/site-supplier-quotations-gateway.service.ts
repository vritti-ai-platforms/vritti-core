import type {
  SupplierQuotationDetailResponseDto,
  SupplierQuotationResponseDto,
} from '@commerce/supplier-quotations/dto/response/supplier-quotation-response.dto';
import type { SupplierQuotationTableResponseDto } from '@commerce/supplier-quotations/dto/response/supplier-quotation-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { OwnerNameService } from '@/owner-names/owner-name.service';

@Injectable()
export class SiteSupplierQuotationsGatewayService {
  private readonly logger = new Logger(SiteSupplierQuotationsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly ownerNames: OwnerNameService,
  ) {}

  // The supplier's quotations posted to the session site, with server-stored table state
  async findForTable(supplierId: string, userId: string): Promise<SupplierQuotationTableResponseDto> {
    this.logger.log(`site.suppliers.quotations.table — supplierId: ${supplierId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-site-supplier-${supplierId}-quotations`,
    );
    const { result, count } = await this.nats.send<{ result: SupplierQuotationResponseDto[]; count: number }>(
      'commerce',
      'site.suppliers.quotations.table',
      { supplierId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // A quotation posted to the session site, with its lines and its posted sites named
  async findById(supplierId: string, quotationId: string, orgId: string): Promise<SupplierQuotationDetailResponseDto> {
    this.logger.log(`site.suppliers.quotations.findById — supplierId: ${supplierId}, id: ${quotationId}`);
    const quotation = await this.nats.send<SupplierQuotationDetailResponseDto>(
      'commerce',
      'site.suppliers.quotations.findById',
      { supplierId, quotationId },
    );
    return { ...quotation, sites: await this.ownerNames.withSiteNames(orgId, quotation.sites) };
  }
}
