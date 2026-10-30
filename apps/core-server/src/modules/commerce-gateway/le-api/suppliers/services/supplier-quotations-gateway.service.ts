import type { AddSupplierQuotationItemDto } from '@commerce/supplier-quotations/dto/request/add-supplier-quotation-item.dto';
import type { CreateSupplierQuotationDto } from '@commerce/supplier-quotations/dto/request/create-supplier-quotation.dto';
import type { SupplierQuotationItemFieldsDto } from '@commerce/supplier-quotations/dto/request/supplier-quotation-item-fields.dto';
import type { UpdateSupplierQuotationDto } from '@commerce/supplier-quotations/dto/request/update-supplier-quotation.dto';
import type {
  SupplierQuotationDetailResponseDto,
  SupplierQuotationResponseDto,
} from '@commerce/supplier-quotations/dto/response/supplier-quotation-response.dto';
import type { SupplierQuotationTableResponseDto } from '@commerce/supplier-quotations/dto/response/supplier-quotation-table-response.dto';
import { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class SupplierQuotationsGatewayService {
  private readonly logger = new Logger(SupplierQuotationsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly siteRepository: SiteDomainRepository,
  ) {}

  async findForTable(supplierId: string, userId: string): Promise<SupplierQuotationTableResponseDto> {
    this.logger.log(`le.suppliers.quotations.table — supplierId: ${supplierId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-supplier-${supplierId}-quotations`,
    );
    const { result, count } = await this.nats.send<{ result: SupplierQuotationResponseDto[]; count: number }>(
      'commerce',
      'le.suppliers.quotations.table',
      { supplierId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Returns a supplier's quotations posted to one of the LE's sites, for the site view's table
  async findForSiteTable(
    supplierId: string,
    siteId: string,
    userId: string,
  ): Promise<SupplierQuotationTableResponseDto> {
    this.logger.log(`le.suppliers.quotations.table — supplierId: ${supplierId}, siteId: ${siteId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-le-supplier-${supplierId}-site-${siteId}-quotations`,
    );
    const { result, count } = await this.nats.send<{ result: SupplierQuotationResponseDto[]; count: number }>(
      'commerce',
      'le.suppliers.quotations.table',
      { supplierId, siteId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Returns a quotation with its lines and the sites it is posted to, named
  async findById(id: string, orgId: string): Promise<SupplierQuotationDetailResponseDto> {
    const quotation = await this.nats.send<SupplierQuotationDetailResponseDto>(
      'commerce',
      'le.suppliers.quotations.findById',
      { id },
    );
    const sites = await this.siteRepository.findByIds(
      orgId,
      quotation.sites.map((site) => site.siteId),
    );
    const sitesById = new Map(sites.map((site) => [site.id, site]));
    return {
      ...quotation,
      sites: quotation.sites.map((site) => ({
        ...site,
        siteName: sitesById.get(site.siteId)?.name ?? null,
        siteCode: sitesById.get(site.siteId)?.code ?? null,
      })),
    };
  }

  create(
    supplierId: string,
    dto: CreateSupplierQuotationDto,
  ): Promise<CreateResponseDto<SupplierQuotationResponseDto>> {
    return this.nats.send('commerce', 'le.suppliers.quotations.create', { ...dto, supplierId });
  }

  update(id: string, dto: UpdateSupplierQuotationDto): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'le.suppliers.quotations.update', { ...dto, id });
  }

  delete(id: string): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'le.suppliers.quotations.delete', { id });
  }

  addItem(quotationId: string, dto: AddSupplierQuotationItemDto): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'le.suppliers.quotations.items.add', { ...dto, quotationId });
  }

  updateItem(quotationId: string, id: string, dto: SupplierQuotationItemFieldsDto): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'le.suppliers.quotations.items.update', { ...dto, quotationId, id });
  }

  removeItem(quotationId: string, id: string): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'le.suppliers.quotations.items.delete', { quotationId, id });
  }

  // Posts the quotation to one of the session legal entity's sites
  async postToSite(
    quotationId: string,
    siteId: string,
    orgId: string,
    legalEntityId: string | undefined,
  ): Promise<SuccessResponseDto> {
    const [site] = await this.siteRepository.findByIds(orgId, [siteId]);
    if (!legalEntityId || !site || site.legalEntityId !== legalEntityId) {
      throw new BadRequestException({
        label: 'Invalid Site',
        detail: 'The selected site does not belong to this legal entity.',
        errors: [{ field: 'siteId', message: 'Not a site of this legal entity' }],
      });
    }
    return this.nats.send('commerce', 'le.suppliers.quotations.sites.post', { quotationId, siteId });
  }

  removeFromSite(quotationId: string, siteId: string): Promise<SuccessResponseDto> {
    return this.nats.send('commerce', 'le.suppliers.quotations.sites.remove', { quotationId, siteId });
  }
}
