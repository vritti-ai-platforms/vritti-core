import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';
import { PurchasesSupplierInvoicesService } from '@/modules/site/purchases/supplier-invoices/services/purchases-supplier-invoices.service';
import { LeCreatePurchaseSupplierInvoiceDto } from './dto/request/le-create-purchase-supplier-invoice.dto';

@Controller()
export class LePurchasesSupplierInvoicesController {
  private readonly logger = new Logger(LePurchasesSupplierInvoicesController.name);

  constructor(private readonly service: PurchasesSupplierInvoicesService) {}

  // Drafts the supplier's invoice of what its open legs at one of the legal entity's sites received and did not invoice yet
  @MessagePattern({ cmd: 'le.purchases.supplierInvoices.create' })
  create(
    @Payload() dto: LeCreatePurchaseSupplierInvoiceDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<{ supplierInvoiceId: string }>> {
    this.logger.log(`le.purchases.supplierInvoices.create — site: ${dto.siteId}, supplier: ${dto.supplierId}`);
    const { siteId, ...invoice } = dto;
    return this.service.create(invoice, { siteId, leCurrencyCode: headers.leCurrencyCode });
  }
}
