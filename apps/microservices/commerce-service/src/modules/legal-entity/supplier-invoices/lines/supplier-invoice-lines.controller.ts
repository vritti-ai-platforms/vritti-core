import { AddSupplierInvoiceLineDto } from '@domain/supplier-invoices/dto/request/add-supplier-invoice-line.dto';
import { UpdateSupplierInvoiceLineDto } from '@domain/supplier-invoices/dto/request/update-supplier-invoice-line.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RpcLeCurrencyCode } from '@vritti/api-sdk/nats';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SupplierInvoiceLinesService } from '@/modules/site/suppliers/invoices/lines/services/supplier-invoice-lines.service';

@Controller()
export class LeSupplierInvoiceLinesController {
  private readonly logger = new Logger(LeSupplierInvoiceLinesController.name);

  constructor(private readonly service: SupplierInvoiceLinesService) {}

  // Adds an item line invoicing a received lot, or a charge line, to an invoice
  @MessagePattern({ cmd: 'le.supplierInvoices.lines.create' })
  create(
    @Payload() dto: AddSupplierInvoiceLineDto,
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.lines.create — invoiceId: ${dto.supplierInvoiceId}, type: ${dto.lineType}`);
    return this.service.create(dto, leCurrencyCode);
  }

  // Updates a line of an invoice
  @MessagePattern({ cmd: 'le.supplierInvoices.lines.update' })
  update(
    @Payload() dto: UpdateSupplierInvoiceLineDto,
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.lines.update — id: ${dto.id}`);
    return this.service.update(dto, leCurrencyCode);
  }

  // Removes a line from an invoice
  @MessagePattern({ cmd: 'le.supplierInvoices.lines.delete' })
  delete(
    @Payload() data: { supplierInvoiceId: string; id: string },
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.lines.delete — id: ${data.id}`);
    return this.service.delete(data.supplierInvoiceId, data.id, leCurrencyCode);
  }
}
