import type {
  SupplierInvoiceDetailDto,
  SupplierInvoiceDto,
} from '@domain/supplier-invoices/dto/entity/supplier-invoice.dto';
import type { SupplierInvoiceCountsDto } from '@domain/supplier-invoices/dto/entity/supplier-invoice-counts.dto';
import { LeCreateSupplierInvoiceDto } from '@domain/supplier-invoices/dto/request/le-create-supplier-invoice.dto';
import { LeInvoiceableGoodsReceiptsQueryDto } from '@domain/supplier-invoices/dto/request/le-invoiceable-goods-receipts-query.dto';
import { UpdateSupplierInvoiceDto } from '@domain/supplier-invoices/dto/request/update-supplier-invoice.dto';
import { SupplierInvoicesDomainService } from '@domain/supplier-invoices/services/supplier-invoices.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcLeCurrencyCode, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { InvoiceableGoodsReceiptWithDisplayDto } from '@/modules/site/suppliers/invoices/root/dto/entity/invoiceable-goods-receipt-with-display.dto';
import { SupplierInvoicesService } from '@/modules/site/suppliers/invoices/root/services/supplier-invoices.service';

@Controller()
export class LeSupplierInvoicesRootController {
  private readonly logger = new Logger(LeSupplierInvoicesRootController.name);

  constructor(
    private readonly invoicesService: SupplierInvoicesDomainService,
    private readonly service: SupplierInvoicesService,
  ) {}

  // Records a draft invoice of a supplier at one of the legal entity's sites
  @MessagePattern({ cmd: 'le.supplierInvoices.create' })
  create(
    @Payload() dto: LeCreateSupplierInvoiceDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<SupplierInvoiceDto>> {
    const { siteId, ...invoice } = dto;
    this.logger.log(`le.supplierInvoices.create — supplierId: ${invoice.supplierId}, site: ${siteId}`);
    return this.service.create(invoice, {
      siteId,
      leCurrencyCode: headers.leCurrencyCode,
    });
  }

  // Updates an invoice's header
  @MessagePattern({ cmd: 'le.supplierInvoices.update' })
  update(
    @Payload() dto: UpdateSupplierInvoiceDto,
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.update — id: ${dto.id}`);
    return this.service.update(dto, leCurrencyCode);
  }

  // Posts a draft invoice, setting the final cost of the stock it invoices
  @MessagePattern({ cmd: 'le.supplierInvoices.post' })
  post(@Payload() data: { id: string }, @RpcNatsHeaders() headers: NatsHeaders): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.post — id: ${data.id}`);
    return this.service.post(data.id, headers.leCurrencyCode, headers.userId || null);
  }

  // Cancels an invoice, reversing its costing and invoiced quantities when it was posted
  @MessagePattern({ cmd: 'le.supplierInvoices.cancel' })
  cancel(@Payload() data: { id: string }, @RpcNatsHeaders() headers: NatsHeaders): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.cancel — id: ${data.id}`);
    return this.service.cancel(data.id, headers.leCurrencyCode);
  }

  // Returns an invoice with its lines and holds
  @MessagePattern({ cmd: 'le.supplierInvoices.findById' })
  findById(
    @Payload() data: { id: string },
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<SupplierInvoiceDetailDto> {
    this.logger.log(`le.supplierInvoices.findById — id: ${data.id}`);
    return this.invoicesService.findById(data.id, leCurrencyCode);
  }

  // Returns the invoices of the legal entity's sites for the data table
  @MessagePattern({ cmd: 'le.supplierInvoices.table' })
  table(@Payload() state: TableState): Promise<{ result: SupplierInvoiceDto[]; count: number }> {
    this.logger.log('le.supplierInvoices.table');
    return this.invoicesService.findForTable(state);
  }

  // Counts an invoice's lines and holds, one per tab of its detail page
  @MessagePattern({ cmd: 'le.supplierInvoices.findCounts' })
  findCounts(@Payload() data: { id: string }): Promise<SupplierInvoiceCountsDto> {
    this.logger.log(`le.supplierInvoices.findCounts — id: ${data.id}`);
    return this.invoicesService.findCounts(data.id);
  }

  // Returns a supplier's posted receipt lots at one of the legal entity's sites still to invoice, for an invoice's line picker
  @MessagePattern({ cmd: 'le.supplierInvoices.invoiceableGoodsReceipts' })
  invoiceableGoodsReceipts(
    @Payload() query: LeInvoiceableGoodsReceiptsQueryDto,
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<InvoiceableGoodsReceiptWithDisplayDto[]> {
    this.logger.log(
      `le.supplierInvoices.invoiceableGoodsReceipts — supplierId: ${query.supplierId}, site: ${query.siteId}`,
    );
    return this.service.findInvoiceableGoodsReceipts(query, leCurrencyCode);
  }

  // Deletes a draft invoice
  @MessagePattern({ cmd: 'le.supplierInvoices.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
