import type { CreateSupplierInvoiceDto } from '@commerce/supplier-invoices/dto/request/create-supplier-invoice.dto';
import type { SupplierInvoiceLineDto } from '@commerce/supplier-invoices/dto/request/supplier-invoice-line.dto';
import type { UpdateSupplierInvoiceDto } from '@commerce/supplier-invoices/dto/request/update-supplier-invoice.dto';
import type {
  SupplierInvoiceDetailResponseDto,
  SupplierInvoiceResponseDto,
} from '@commerce/supplier-invoices/dto/response/supplier-invoice-response.dto';
import type { SupplierInvoiceTableResponseDto } from '@commerce/supplier-invoices/dto/response/supplier-invoice-table-response.dto';
import { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';

type CommerceSupplierInvoice = Omit<SupplierInvoiceResponseDto, 'siteName' | 'siteCode'>;
type CommerceSupplierInvoiceDetail = Omit<SupplierInvoiceDetailResponseDto, 'siteName' | 'siteCode'>;

@Injectable()
export class SupplierInvoicesGatewayService {
  private readonly logger = new Logger(SupplierInvoicesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly ownerNames: OwnerNameService,
    private readonly siteRepository: SiteDomainRepository,
  ) {}

  // Returns the invoices of the legal entity's sites with server-stored state and site names
  async findForTable(userId: string, orgId: string): Promise<SupplierInvoiceTableResponseDto> {
    this.logger.log('le.supplierInvoices.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-le-supplier-invoices');
    const { result, count } = await this.nats.send<{ result: CommerceSupplierInvoice[]; count: number }>(
      'commerce',
      'le.supplierInvoices.table',
      state,
    );
    return { result: await this.ownerNames.withSiteNames(orgId, result), count, state, activeViewId };
  }

  // Returns an invoice with its lines, flags and linked receipts, its site named
  async findById(
    id: string,
    orgId: string,
    legalEntityId: string | undefined,
  ): Promise<SupplierInvoiceDetailResponseDto> {
    this.logger.log(`le.supplierInvoices.findById — id: ${id}`);
    const invoice = await this.nats.send<CommerceSupplierInvoiceDetail>('commerce', 'le.supplierInvoices.findById', {
      id,
      leCurrencyCode: await this.leCurrencyCode(legalEntityId),
    });
    const [named] = await this.ownerNames.withSiteNames(orgId, [invoice]);
    return named;
  }

  // Records a draft invoice billing a purchase order of one of the legal entity's sites
  create(dto: CreateSupplierInvoiceDto): Promise<CreateResponseDto<SupplierInvoiceResponseDto>> {
    this.logger.log(
      `le.supplierInvoices.create — purchaseOrderId: ${dto.purchaseOrderId}, number: ${dto.invoiceNumber}`,
    );
    return this.nats.send('commerce', 'le.supplierInvoices.create', dto);
  }

  // Updates an invoice's header; a posted invoice is re-costed in the legal entity's currency
  async update(
    id: string,
    dto: UpdateSupplierInvoiceDto,
    legalEntityId: string | undefined,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.update — id: ${id}`);
    return this.nats.send('commerce', 'le.supplierInvoices.update', {
      ...dto,
      id,
      leCurrencyCode: await this.leCurrencyCode(legalEntityId),
    });
  }

  // Posts a draft invoice, setting the final cost of the stock it bills
  async post(id: string, legalEntityId: string | undefined): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.post — id: ${id}`);
    return this.nats.send('commerce', 'le.supplierInvoices.post', {
      id,
      leCurrencyCode: await this.leCurrencyCode(legalEntityId),
    });
  }

  // Cancels an invoice, reversing its costing when it was posted
  async cancel(id: string, legalEntityId: string | undefined): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.cancel — id: ${id}`);
    return this.nats.send('commerce', 'le.supplierInvoices.cancel', {
      id,
      leCurrencyCode: await this.leCurrencyCode(legalEntityId),
    });
  }

  // Deletes a draft invoice
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.delete — id: ${id}`);
    return this.nats.send('commerce', 'le.supplierInvoices.delete', { id });
  }

  // Adds a billed line to an invoice
  async createLine(
    supplierInvoiceId: string,
    dto: SupplierInvoiceLineDto,
    legalEntityId: string | undefined,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.lines.create — invoiceId: ${supplierInvoiceId}`);
    return this.nats.send('commerce', 'le.supplierInvoices.lines.create', {
      ...dto,
      supplierInvoiceId,
      leCurrencyCode: await this.leCurrencyCode(legalEntityId),
    });
  }

  // Updates a line of an invoice
  async updateLine(
    supplierInvoiceId: string,
    id: string,
    dto: SupplierInvoiceLineDto,
    legalEntityId: string | undefined,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.lines.update — id: ${id}`);
    return this.nats.send('commerce', 'le.supplierInvoices.lines.update', {
      ...dto,
      id,
      supplierInvoiceId,
      leCurrencyCode: await this.leCurrencyCode(legalEntityId),
    });
  }

  // Removes a line from an invoice
  async deleteLine(
    supplierInvoiceId: string,
    id: string,
    legalEntityId: string | undefined,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.lines.delete — id: ${id}`);
    return this.nats.send('commerce', 'le.supplierInvoices.lines.delete', {
      supplierInvoiceId,
      id,
      leCurrencyCode: await this.leCurrencyCode(legalEntityId),
    });
  }

  // Resolves the legal entity's currency, which invoice costing and variances are kept in; commerce gets no site
  // context in an LE request to read it from
  private async leCurrencyCode(legalEntityId: string | undefined): Promise<string> {
    const legalEntity = legalEntityId ? await this.siteRepository.findLegalEntityById(legalEntityId) : undefined;
    if (!legalEntity) throw new NotFoundException('Legal entity not found.');
    return legalEntity.currencyCode;
  }
}
