import type {
  SupplierInvoiceDetailDto,
  SupplierInvoiceDto,
} from '@domain/supplier-invoices/dto/entity/supplier-invoice.dto';
import { CreateSupplierInvoiceDto } from '@domain/supplier-invoices/dto/request/create-supplier-invoice.dto';
import { UpdateSupplierInvoiceDto } from '@domain/supplier-invoices/dto/request/update-supplier-invoice.dto';
import { SupplierInvoicesDomainService } from '@domain/supplier-invoices/services/supplier-invoices.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders, RpcSiteCurrencyCode } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class SiteSupplierInvoicesController {
  private readonly logger = new Logger(SiteSupplierInvoicesController.name);

  constructor(private readonly service: SupplierInvoicesDomainService) {}

  // Returns the supplier's invoices at the caller's site for the data table
  @MessagePattern({ cmd: 'site.suppliers.invoices.table' })
  table(
    @Payload() data: { supplierId: string } & TableState,
  ): Promise<{ result: SupplierInvoiceDto[]; count: number }> {
    const { supplierId, ...state } = data;
    this.logger.log(`site.suppliers.invoices.table — supplierId: ${supplierId}`);
    return this.service.findForTable(state, { supplierId });
  }

  // Returns one of the supplier's invoices with its lines, flags and linked receipts
  @MessagePattern({ cmd: 'site.suppliers.invoices.findById' })
  findById(
    @Payload() data: { supplierId: string; id: string },
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<SupplierInvoiceDetailDto> {
    this.logger.log(`site.suppliers.invoices.findById — supplierId: ${data.supplierId}, id: ${data.id}`);
    return this.service.findById(data.id, siteCurrencyCode, { supplierId: data.supplierId });
  }

  // Records a draft invoice billing one of the site's purchase orders
  @MessagePattern({ cmd: 'site.suppliers.invoices.create' })
  create(
    @Payload() dto: CreateSupplierInvoiceDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<SupplierInvoiceDto>> {
    this.logger.log(
      `site.suppliers.invoices.create — purchaseOrderId: ${dto.purchaseOrderId}, number: ${dto.invoiceNumber}`,
    );
    return this.service.create(dto, headers.userId || null);
  }

  // Updates an invoice's header
  @MessagePattern({ cmd: 'site.suppliers.invoices.update' })
  update(
    @Payload() dto: UpdateSupplierInvoiceDto,
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.invoices.update — id: ${dto.id}`);
    return this.service.update(dto, siteCurrencyCode);
  }

  // Posts a draft invoice, setting the final cost of the stock it bills
  @MessagePattern({ cmd: 'site.suppliers.invoices.post' })
  post(
    @Payload() data: { id: string },
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.invoices.post — id: ${data.id}`);
    return this.service.post(data.id, siteCurrencyCode, headers.userId || null);
  }
}
