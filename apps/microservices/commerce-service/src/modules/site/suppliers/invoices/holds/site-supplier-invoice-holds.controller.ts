import { ReleaseSupplierInvoiceHoldDto } from '@domain/supplier-invoices/dto/request/release-supplier-invoice-hold.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SupplierInvoicesService } from '../root/services/supplier-invoices.service';

@Controller()
export class SiteSupplierInvoiceHoldsController {
  private readonly logger = new Logger(SiteSupplierInvoiceHoldsController.name);

  constructor(private readonly service: SupplierInvoicesService) {}

  // Releases an open hold of an invoice with a reason
  @MessagePattern({ cmd: 'site.suppliers.invoices.holds.release' })
  release(
    @Payload() dto: ReleaseSupplierInvoiceHoldDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.invoices.holds.release — invoiceId: ${dto.supplierInvoiceId}, hold: ${dto.id}`);
    return this.service.releaseHold(dto, headers.userId);
  }
}
