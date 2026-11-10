import type { CreateSupplierEnrollmentDto } from '@commerce/supplier-enrollments/dto/request/create-supplier-enrollment.dto';
import type { UpdateSupplierEnrollmentDto } from '@commerce/supplier-enrollments/dto/request/update-supplier-enrollment.dto';
import type { SupplierEnrollmentDetailResponseDto } from '@commerce/supplier-enrollments/dto/response/supplier-enrollment-detail-response.dto';
import type { SupplierEnrollmentResponseDto } from '@commerce/supplier-enrollments/dto/response/supplier-enrollment-response.dto';
import type { SupplierEnrollmentRowResponseDto } from '@commerce/supplier-enrollments/dto/response/supplier-enrollment-row-response.dto';
import type { SupplierEnrollmentTableResponseDto } from '@commerce/supplier-enrollments/dto/response/supplier-enrollment-table-response.dto';
import type { CreateSupplierInvoiceDto } from '@commerce/supplier-invoices/dto/request/create-supplier-invoice.dto';
import type { SupplierInvoiceLineDto } from '@commerce/supplier-invoices/dto/request/supplier-invoice-line.dto';
import type { UpdateSupplierInvoiceDto } from '@commerce/supplier-invoices/dto/request/update-supplier-invoice.dto';
import type {
  SupplierInvoiceDetailResponseDto,
  SupplierInvoiceResponseDto,
} from '@commerce/supplier-invoices/dto/response/supplier-invoice-response.dto';
import type { SupplierInvoiceTableResponseDto } from '@commerce/supplier-invoices/dto/response/supplier-invoice-table-response.dto';
import type { UpdateSupplierSiteItemDto } from '@commerce/supplier-items/dto/request/update-supplier-site-item.dto';
import type { SupplierSiteItemRowResponseDto } from '@commerce/supplier-items/dto/response/supplier-site-item-row-response.dto';
import type { SupplierSiteItemRowTableResponseDto } from '@commerce/supplier-items/dto/response/supplier-site-item-row-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';

@Injectable()
export class SiteSuppliersGatewayService {
  private readonly logger = new Logger(SiteSuppliersGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly ownerNames: OwnerNameService,
  ) {}

  // Returns the legal entity's suppliers with their enrollment at this site for the data table, named by core
  async findForTable(userId: string, orgId: string): Promise<SupplierEnrollmentTableResponseDto> {
    this.logger.log('site.suppliers.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-site-suppliers');

    const { result, count } = await this.nats.send<{ result: SupplierEnrollmentRowResponseDto[]; count: number }>(
      'commerce',
      'site.suppliers.table',
      state,
    );

    return { result: await this.ownerNames.withSiteNames(orgId, result), count, state, activeViewId };
  }

  // Enrolls a supplier at the session site
  async create(
    dto: CreateSupplierEnrollmentDto,
    siteId: string | undefined,
  ): Promise<CreateResponseDto<SupplierEnrollmentResponseDto>> {
    this.logger.log(`site.suppliers.create — supplierId: ${dto.supplierId}`);
    return this.nats.send('commerce', 'site.suppliers.create', { ...dto, siteId });
  }

  // Returns a supplier's enrollment at the session site, enrolled or not, with the site's name
  async findById(supplierId: string, orgId: string): Promise<SupplierEnrollmentDetailResponseDto> {
    this.logger.log(`site.suppliers.findById — supplierId: ${supplierId}`);
    const row = await this.nats.send<SupplierEnrollmentDetailResponseDto>('commerce', 'site.suppliers.findById', {
      supplierId,
    });
    const [enriched] = await this.ownerNames.withSiteNames(orgId, [row]);
    return enriched;
  }

  // Updates a supplier's enrollment picks and flags at the session site
  async update(
    supplierId: string,
    dto: UpdateSupplierEnrollmentDto,
    siteId: string | undefined,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.update — supplierId: ${supplierId}`);
    return this.nats.send('commerce', 'site.suppliers.update', { ...dto, supplierId, siteId });
  }

  // Activates or deactivates a supplier's own enrollment at the session site
  async setActive(supplierId: string, isActive: boolean, siteId: string | undefined): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.setActive — supplierId: ${supplierId}, isActive: ${isActive}`);
    return this.nats.send('commerce', 'site.suppliers.setActive', { supplierId, siteId, isActive });
  }

  // Removes a supplier's enrollment at the session site
  async delete(supplierId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.delete — supplierId: ${supplierId}`);
    return this.nats.send('commerce', 'site.suppliers.delete', { supplierId });
  }

  // Returns an enrolled supplier's site items at this site for the data table
  async findSiteItemsTable(supplierId: string, userId: string): Promise<SupplierSiteItemRowTableResponseDto> {
    this.logger.log(`site.suppliers.siteItems.table — supplierId: ${supplierId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-site-supplier-${supplierId}-site-items`,
    );

    const { result, count } = await this.nats.send<{ result: SupplierSiteItemRowResponseDto[]; count: number }>(
      'commerce',
      'site.suppliers.siteItems.table',
      { supplierId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Returns a supplier item's detail with this site's terms and price in force
  async findSiteItemById(supplierItemId: string): Promise<SupplierSiteItemRowResponseDto> {
    this.logger.log(`site.suppliers.siteItems.findById — supplierItemId: ${supplierItemId}`);
    return this.nats.send('commerce', 'site.suppliers.siteItems.findById', { supplierItemId });
  }

  // Updates this site's terms for a supplier item (preferred, lead time)
  async updateSiteItem(supplierSiteItemId: string, dto: UpdateSupplierSiteItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.siteItems.update — id: ${supplierSiteItemId}`);
    return this.nats.send('commerce', 'site.suppliers.siteItems.update', { id: supplierSiteItemId, ...dto });
  }

  // Returns the supplier's invoices at this site for the data table
  async findInvoicesTable(supplierId: string, userId: string, orgId: string): Promise<SupplierInvoiceTableResponseDto> {
    this.logger.log(`site.suppliers.invoices.table — supplierId: ${supplierId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-site-supplier-${supplierId}-invoices`,
    );
    const { result, count } = await this.nats.send<{
      result: Omit<SupplierInvoiceResponseDto, 'siteName' | 'siteCode'>[];
      count: number;
    }>('commerce', 'site.suppliers.invoices.table', { supplierId, ...state });
    return { result: await this.ownerNames.withSiteNames(orgId, result), count, state, activeViewId };
  }

  // Returns one of the supplier's invoices with its lines, flags and linked receipts
  async findInvoiceById(supplierId: string, id: string, orgId: string): Promise<SupplierInvoiceDetailResponseDto> {
    this.logger.log(`site.suppliers.invoices.findById — supplierId: ${supplierId}, id: ${id}`);
    const invoice = await this.nats.send<Omit<SupplierInvoiceDetailResponseDto, 'siteName' | 'siteCode'>>(
      'commerce',
      'site.suppliers.invoices.findById',
      { supplierId, id },
    );
    const [named] = await this.ownerNames.withSiteNames(orgId, [invoice]);
    return named;
  }

  // Records a draft invoice billing one of this site's purchase orders
  createInvoice(dto: CreateSupplierInvoiceDto): Promise<CreateResponseDto<SupplierInvoiceResponseDto>> {
    this.logger.log(
      `site.suppliers.invoices.create — purchaseOrderId: ${dto.purchaseOrderId}, number: ${dto.invoiceNumber}`,
    );
    return this.nats.send('commerce', 'site.suppliers.invoices.create', dto);
  }

  // Updates an invoice's header
  updateInvoice(id: string, dto: UpdateSupplierInvoiceDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.invoices.update — id: ${id}`);
    return this.nats.send('commerce', 'site.suppliers.invoices.update', { ...dto, id });
  }

  // Posts a draft invoice, setting the final cost of the stock it bills
  postInvoice(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.invoices.post — id: ${id}`);
    return this.nats.send('commerce', 'site.suppliers.invoices.post', { id });
  }

  // Adds a billed line to an invoice
  createInvoiceLine(supplierInvoiceId: string, dto: SupplierInvoiceLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.invoices.lines.create — invoiceId: ${supplierInvoiceId}`);
    return this.nats.send('commerce', 'site.suppliers.invoices.lines.create', { ...dto, supplierInvoiceId });
  }

  // Updates a line of an invoice
  updateInvoiceLine(supplierInvoiceId: string, id: string, dto: SupplierInvoiceLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.invoices.lines.update — id: ${id}`);
    return this.nats.send('commerce', 'site.suppliers.invoices.lines.update', { ...dto, id, supplierInvoiceId });
  }

  // Removes a line from an invoice
  deleteInvoiceLine(supplierInvoiceId: string, id: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.invoices.lines.delete — id: ${id}`);
    return this.nats.send('commerce', 'site.suppliers.invoices.lines.delete', { supplierInvoiceId, id });
  }
}
