import type { AddSupplierQuotationItemDto } from '@commerce/supplier-quotations/dto/request/add-supplier-quotation-item.dto';
import type { CreateSupplierQuotationDto } from '@commerce/supplier-quotations/dto/request/create-supplier-quotation.dto';
import type { SupplierQuotationItemFieldsDto } from '@commerce/supplier-quotations/dto/request/supplier-quotation-item-fields.dto';
import type { UpdateSupplierQuotationDto } from '@commerce/supplier-quotations/dto/request/update-supplier-quotation.dto';
import type {
  SupplierQuotationDetailResponseDto,
  SupplierQuotationResponseDto,
} from '@commerce/supplier-quotations/dto/response/supplier-quotation-response.dto';
import type { SupplierQuotationTableResponseDto } from '@commerce/supplier-quotations/dto/response/supplier-quotation-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';

@Injectable()
export class SiteSupplierQuotationsGatewayService {
  private readonly logger = new Logger(SiteSupplierQuotationsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly ownerNames: OwnerNameService,
  ) {}

  // Records a draft quotation of the supplier the session site owns
  create(
    supplierId: string,
    dto: CreateSupplierQuotationDto,
  ): Promise<CreateResponseDto<SupplierQuotationResponseDto>> {
    this.logger.log(`site.suppliers.quotations.create — supplierId: ${supplierId}`);
    return this.nats.send('commerce', 'site.suppliers.quotations.create', { ...dto, supplierId });
  }

  // Adds a line to a draft quotation the session site owns
  addItem(quotationId: string, dto: AddSupplierQuotationItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.quotations.items.add — quotationId: ${quotationId}`);
    return this.nats.send('commerce', 'site.suppliers.quotations.items.add', { ...dto, quotationId });
  }

  // Changes the header of a quotation the session site owns
  update(id: string, dto: UpdateSupplierQuotationDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.quotations.update — id: ${id}`);
    return this.nats.send('commerce', 'site.suppliers.quotations.update', { ...dto, id });
  }

  // Changes a line of a draft quotation the session site owns
  updateItem(quotationId: string, id: string, dto: SupplierQuotationItemFieldsDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.quotations.items.update — id: ${id}`);
    return this.nats.send('commerce', 'site.suppliers.quotations.items.update', { ...dto, quotationId, id });
  }

  // Posts a quotation the session site owns to the site, writing its lines as the site's prices
  post(quotationId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.quotations.post — quotationId: ${quotationId}`);
    return this.nats.send('commerce', 'site.suppliers.quotations.post', { quotationId });
  }

  // A quotation the session site can read, with its lines and posted sites, its owner and sites named
  async findById(supplierId: string, quotationId: string, orgId: string): Promise<SupplierQuotationDetailResponseDto> {
    this.logger.log(`site.suppliers.quotations.findById — supplierId: ${supplierId}, id: ${quotationId}`);
    const quotation = await this.nats.send<Omit<SupplierQuotationDetailResponseDto, 'ownerName'>>(
      'commerce',
      'site.suppliers.quotations.findById',
      { supplierId, quotationId },
    );
    const [named] = await this.ownerNames.resolve(orgId, [quotation]);
    return { ...named, sites: await this.ownerNames.withOptionalSiteNames(orgId, quotation.sites) };
  }

  // The supplier's quotations the session site can read, each owner named, with server-stored table state
  async findForTable(supplierId: string, userId: string, orgId: string): Promise<SupplierQuotationTableResponseDto> {
    this.logger.log(`site.suppliers.quotations.table — supplierId: ${supplierId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-site-supplier-${supplierId}-quotations`,
    );
    const { result, count } = await this.nats.send<{
      result: Omit<SupplierQuotationResponseDto, 'ownerName'>[];
      count: number;
    }>('commerce', 'site.suppliers.quotations.table', { supplierId, ...state });
    return { result: await this.ownerNames.resolve(orgId, result), count, state, activeViewId };
  }

  // Deletes a quotation the session site owns while it is posted nowhere else
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.quotations.delete — id: ${id}`);
    return this.nats.send('commerce', 'site.suppliers.quotations.delete', { id });
  }

  // Removes a line from a draft quotation the session site owns
  removeItem(quotationId: string, id: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.quotations.items.delete — id: ${id}`);
    return this.nats.send('commerce', 'site.suppliers.quotations.items.delete', { quotationId, id });
  }

  // Removes a quotation posted to the session site, whoever owns it, with its prices here
  remove(quotationId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.quotations.remove — quotationId: ${quotationId}`);
    return this.nats.send('commerce', 'site.suppliers.quotations.remove', { quotationId });
  }
}
