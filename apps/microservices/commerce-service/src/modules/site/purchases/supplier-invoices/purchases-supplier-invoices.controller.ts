import { CreatePurchaseSupplierInvoiceDto } from '@domain/purchases/dto/request/create-purchase-supplier-invoice.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';
import { PurchasesSupplierInvoicesService } from './services/purchases-supplier-invoices.service';

@Controller()
export class PurchasesSupplierInvoicesController {
  private readonly logger = new Logger(PurchasesSupplierInvoicesController.name);

  constructor(private readonly service: PurchasesSupplierInvoicesService) {}

  // Drafts the supplier's invoice of what its open legs at the site received and did not invoice yet
  @MessagePattern({ cmd: 'site.purchases.supplierInvoices.create' })
  create(
    @Payload() dto: CreatePurchaseSupplierInvoiceDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<{ supplierInvoiceId: string }>> {
    this.logger.log(
      `site.purchases.supplierInvoices.create — supplier: ${dto.supplierId}, invoice: ${dto.invoiceNumber}`,
    );
    return this.service.create(dto, { leCurrencyCode: headers.leCurrencyCode });
  }
}
