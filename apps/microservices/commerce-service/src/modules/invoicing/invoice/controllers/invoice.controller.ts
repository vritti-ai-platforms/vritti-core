import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk';
import type { InvoiceDto } from '../dto/entity/invoice.dto';
import { InvoiceService } from '../services/invoice.service';

@Controller()
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  // Generates an invoice from an order
  @MessagePattern('commerce.invoices.generate')
  generate(@Payload() data: { orderId: string }): Promise<InvoiceDto> {
    return this.invoiceService.generate(data.orderId);
  }

  // Lists all invoices for an org+bu
  @MessagePattern('commerce.invoices.findAll')
  findAll(@Payload() data: { organizationId: string; businessUnitId: string }): Promise<InvoiceDto[]> {
    return this.invoiceService.findAll(data.organizationId, data.businessUnitId);
  }

  // Returns a single invoice by ID
  @MessagePattern('commerce.invoices.findById')
  findById(@Payload() data: { id: string }): Promise<InvoiceDto> {
    return this.invoiceService.findById(data.id);
  }

  // Updates the invoice status
  @MessagePattern('commerce.invoices.updateStatus')
  updateStatus(@Payload() data: { id: string; status: string }): Promise<SuccessResponseDto> {
    return this.invoiceService.updateStatus(data.id, data.status);
  }
}
