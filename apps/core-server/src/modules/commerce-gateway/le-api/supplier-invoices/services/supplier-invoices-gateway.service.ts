import type { LeCreateSupplierInvoiceDto } from '@commerce/supplier-invoices/dto/request/le-create-supplier-invoice.dto';
import type { LeInvoiceableGoodsReceiptsQueryDto } from '@commerce/supplier-invoices/dto/request/le-invoiceable-goods-receipts-query.dto';
import type { ReleaseSupplierInvoiceHoldDto } from '@commerce/supplier-invoices/dto/request/release-supplier-invoice-hold.dto';
import type { SupplierInvoiceLineDto } from '@commerce/supplier-invoices/dto/request/supplier-invoice-line.dto';
import type { UpdateSupplierInvoiceDto } from '@commerce/supplier-invoices/dto/request/update-supplier-invoice.dto';
import type { InvoiceableGoodsReceiptResponseDto } from '@commerce/supplier-invoices/dto/response/invoiceable-goods-receipt-response.dto';
import type {
  SupplierInvoiceDetailResponseDto,
  SupplierInvoiceResponseDto,
} from '@commerce/supplier-invoices/dto/response/supplier-invoice-response.dto';
import type { SupplierInvoiceTableResponseDto } from '@commerce/supplier-invoices/dto/response/supplier-invoice-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
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
  ) {}

  // Records a draft invoice of a supplier at one of the legal entity's sites
  create(dto: LeCreateSupplierInvoiceDto): Promise<CreateResponseDto<SupplierInvoiceResponseDto>> {
    this.logger.log(`le.supplierInvoices.create — supplierId: ${dto.supplierId}, site: ${dto.siteId}`);
    return this.nats.send('commerce', 'le.supplierInvoices.create', dto);
  }

  // Adds an item line invoicing a received lot, or a charge line, to an invoice
  createLine(supplierInvoiceId: string, dto: SupplierInvoiceLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.lines.create — invoiceId: ${supplierInvoiceId}`);
    return this.nats.send('commerce', 'le.supplierInvoices.lines.create', { ...dto, supplierInvoiceId });
  }

  // Updates an invoice's header; a posted invoice is re-costed in the legal entity's currency
  update(id: string, dto: UpdateSupplierInvoiceDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.update — id: ${id}`);
    return this.nats.send('commerce', 'le.supplierInvoices.update', { ...dto, id });
  }

  // Updates a line of an invoice
  updateLine(supplierInvoiceId: string, id: string, dto: SupplierInvoiceLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.lines.update — id: ${id}`);
    return this.nats.send('commerce', 'le.supplierInvoices.lines.update', { ...dto, id, supplierInvoiceId });
  }

  // Posts a draft invoice, setting the final cost of the stock it invoices
  post(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.post — id: ${id}`);
    return this.nats.send('commerce', 'le.supplierInvoices.post', { id });
  }

  // Cancels an invoice, reversing its costing and the order's invoiced quantities when it was posted
  cancel(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.cancel — id: ${id}`);
    return this.nats.send('commerce', 'le.supplierInvoices.cancel', { id });
  }

  // Releases an open hold of an invoice with a reason
  releaseHold(supplierInvoiceId: string, id: string, dto: ReleaseSupplierInvoiceHoldDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.holds.release — invoiceId: ${supplierInvoiceId}, hold: ${id}`);
    return this.nats.send('commerce', 'le.supplierInvoices.holds.release', { ...dto, supplierInvoiceId, id });
  }

  // Returns an invoice with its lines and holds, its site named
  async findById(id: string, orgId: string): Promise<SupplierInvoiceDetailResponseDto> {
    this.logger.log(`le.supplierInvoices.findById — id: ${id}`);
    const invoice = await this.nats.send<CommerceSupplierInvoiceDetail>('commerce', 'le.supplierInvoices.findById', {
      id,
    });
    const [named] = await this.ownerNames.withSiteNames(orgId, [invoice]);
    return named;
  }

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

  // Returns a supplier's posted receipt lots at one of the legal entity's sites still to invoice, oldest receipt first
  findInvoiceableGoodsReceipts(
    siteId: string,
    query: LeInvoiceableGoodsReceiptsQueryDto,
  ): Promise<InvoiceableGoodsReceiptResponseDto[]> {
    this.logger.log(`le.supplierInvoices.invoiceableGoodsReceipts — supplierId: ${query.supplierId}, site: ${siteId}`);
    return this.nats.send('commerce', 'le.supplierInvoices.invoiceableGoodsReceipts', { ...query, siteId });
  }

  // Deletes a draft invoice
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.delete — id: ${id}`);
    return this.nats.send('commerce', 'le.supplierInvoices.delete', { id });
  }

  // Removes a line from an invoice
  deleteLine(supplierInvoiceId: string, id: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.lines.delete — id: ${id}`);
    return this.nats.send('commerce', 'le.supplierInvoices.lines.delete', { supplierInvoiceId, id });
  }
}
