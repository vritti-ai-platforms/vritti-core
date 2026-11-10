import type {
  SupplierInvoiceDetailDto,
  SupplierInvoiceDto,
} from '@domain/supplier-invoices/dto/entity/supplier-invoice.dto';
import { CreateSupplierInvoiceDto } from '@domain/supplier-invoices/dto/request/create-supplier-invoice.dto';
import { LeUpdateSupplierInvoiceDto } from '@domain/supplier-invoices/dto/request/le-update-supplier-invoice.dto';
import { SupplierInvoicesDomainService } from '@domain/supplier-invoices/services/supplier-invoices.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class LeSupplierInvoicesRootController {
  private readonly logger = new Logger(LeSupplierInvoicesRootController.name);

  constructor(private readonly service: SupplierInvoicesDomainService) {}

  // Returns the invoices of the legal entity's sites for the data table
  @MessagePattern({ cmd: 'le.supplierInvoices.table' })
  table(@Payload() state: TableState): Promise<{ result: SupplierInvoiceDto[]; count: number }> {
    this.logger.log('le.supplierInvoices.table');
    return this.service.findForTable(state);
  }

  // Returns an invoice with its lines, flags and linked receipts
  @MessagePattern({ cmd: 'le.supplierInvoices.findById' })
  findById(@Payload() data: { id: string; leCurrencyCode: string }): Promise<SupplierInvoiceDetailDto> {
    this.logger.log(`le.supplierInvoices.findById — id: ${data.id}`);
    return this.service.findById(data.id, data.leCurrencyCode);
  }

  // Records a draft invoice billing a purchase order of one of the legal entity's sites
  @MessagePattern({ cmd: 'le.supplierInvoices.create' })
  create(
    @Payload() dto: CreateSupplierInvoiceDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<SupplierInvoiceDto>> {
    this.logger.log(
      `le.supplierInvoices.create — purchaseOrderId: ${dto.purchaseOrderId}, number: ${dto.invoiceNumber}`,
    );
    return this.service.create(dto, headers.userId || null);
  }

  // Updates an invoice's header
  @MessagePattern({ cmd: 'le.supplierInvoices.update' })
  update(@Payload() dto: LeUpdateSupplierInvoiceDto): Promise<SuccessResponseDto> {
    const { leCurrencyCode, ...invoice } = dto;
    this.logger.log(`le.supplierInvoices.update — id: ${invoice.id}`);
    return this.service.update(invoice, leCurrencyCode);
  }

  // Posts a draft invoice, setting the final cost of the stock it bills
  @MessagePattern({ cmd: 'le.supplierInvoices.post' })
  post(
    @Payload() data: { id: string; leCurrencyCode: string },
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.post — id: ${data.id}`);
    return this.service.post(data.id, data.leCurrencyCode, headers.userId || null);
  }

  // Cancels an invoice, reversing its costing when it was posted
  @MessagePattern({ cmd: 'le.supplierInvoices.cancel' })
  cancel(@Payload() data: { id: string; leCurrencyCode: string }): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.cancel — id: ${data.id}`);
    return this.service.cancel(data.id, data.leCurrencyCode);
  }

  // Deletes a draft invoice
  @MessagePattern({ cmd: 'le.supplierInvoices.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`le.supplierInvoices.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
