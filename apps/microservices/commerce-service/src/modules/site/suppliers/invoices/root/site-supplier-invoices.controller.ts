import type {
  SupplierInvoiceDetailDto,
  SupplierInvoiceDto,
} from '@domain/supplier-invoices/dto/entity/supplier-invoice.dto';
import type { SupplierInvoiceCountsDto } from '@domain/supplier-invoices/dto/entity/supplier-invoice-counts.dto';
import { CreateSupplierInvoiceDto } from '@domain/supplier-invoices/dto/request/create-supplier-invoice.dto';
import { InvoiceableGoodsReceiptsQueryDto } from '@domain/supplier-invoices/dto/request/invoiceable-goods-receipts-query.dto';
import { UpdateSupplierInvoiceDto } from '@domain/supplier-invoices/dto/request/update-supplier-invoice.dto';
import { SupplierInvoicesDomainService } from '@domain/supplier-invoices/services/supplier-invoices.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcLeCurrencyCode, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { InvoiceableGoodsReceiptWithDisplayDto } from './dto/entity/invoiceable-goods-receipt-with-display.dto';
import { SupplierInvoicesService } from './services/supplier-invoices.service';

@Controller()
export class SiteSupplierInvoicesController {
  private readonly logger = new Logger(SiteSupplierInvoicesController.name);

  constructor(
    private readonly invoicesService: SupplierInvoicesDomainService,
    private readonly service: SupplierInvoicesService,
  ) {}

  // Records a draft invoice of the supplier at the site
  @MessagePattern({ cmd: 'site.suppliers.invoices.create' })
  create(
    @Payload() dto: CreateSupplierInvoiceDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<SupplierInvoiceDto>> {
    this.logger.log(`site.suppliers.invoices.create — supplierId: ${dto.supplierId}, number: ${dto.invoiceNumber}`);
    return this.service.create(dto, { leCurrencyCode: headers.leCurrencyCode });
  }

  // Updates an invoice's header
  @MessagePattern({ cmd: 'site.suppliers.invoices.update' })
  update(
    @Payload() dto: UpdateSupplierInvoiceDto,
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.invoices.update — id: ${dto.id}`);
    return this.service.update(dto, leCurrencyCode);
  }

  // Posts a draft invoice, setting the final cost of the stock it invoices
  @MessagePattern({ cmd: 'site.suppliers.invoices.post' })
  post(
    @Payload() data: { id: string },
    @RpcLeCurrencyCode() leCurrencyCode: string,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.invoices.post — id: ${data.id}`);
    return this.service.post(data.id, leCurrencyCode, headers.userId || null);
  }

  // Returns one of the supplier's invoices with its lines and holds
  @MessagePattern({ cmd: 'site.suppliers.invoices.findById' })
  findById(
    @Payload() data: { supplierId: string; id: string },
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<SupplierInvoiceDetailDto> {
    this.logger.log(`site.suppliers.invoices.findById — supplierId: ${data.supplierId}, id: ${data.id}`);
    return this.invoicesService.findById(data.id, leCurrencyCode, { supplierId: data.supplierId });
  }

  // Returns the supplier's invoices at the caller's site for the data table
  @MessagePattern({ cmd: 'site.suppliers.invoices.table' })
  table(
    @Payload() data: { supplierId: string } & TableState,
  ): Promise<{ result: SupplierInvoiceDto[]; count: number }> {
    const { supplierId, ...state } = data;
    this.logger.log(`site.suppliers.invoices.table — supplierId: ${supplierId}`);
    return this.invoicesService.findForTable(state, { supplierId });
  }

  // Counts one of the supplier's invoices' lines and holds, one per tab of its detail page
  @MessagePattern({ cmd: 'site.suppliers.invoices.findCounts' })
  findCounts(@Payload() data: { supplierId: string; id: string }): Promise<SupplierInvoiceCountsDto> {
    this.logger.log(`site.suppliers.invoices.findCounts — supplierId: ${data.supplierId}, id: ${data.id}`);
    return this.invoicesService.findCounts(data.id, { supplierId: data.supplierId });
  }

  // Returns the supplier's posted receipt lots at the site still to invoice, for an invoice's line picker
  @MessagePattern({ cmd: 'site.suppliers.invoices.invoiceableGoodsReceipts' })
  invoiceableGoodsReceipts(
    @Payload() query: InvoiceableGoodsReceiptsQueryDto,
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<InvoiceableGoodsReceiptWithDisplayDto[]> {
    this.logger.log(`site.suppliers.invoices.invoiceableGoodsReceipts — supplierId: ${query.supplierId}`);
    return this.service.findInvoiceableGoodsReceipts(query, leCurrencyCode);
  }
}
