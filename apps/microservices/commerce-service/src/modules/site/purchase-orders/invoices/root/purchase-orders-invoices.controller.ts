import type { PurchaseOrderInvoiceSummaryDto } from '@domain/supplier-invoices/dto/entity/purchase-order-invoice-summary.dto';
import type { SupplierInvoiceDto } from '@domain/supplier-invoices/dto/entity/supplier-invoice.dto';
import { CreateSupplierInvoiceDto } from '@domain/supplier-invoices/dto/request/create-supplier-invoice.dto';
import { SupplierInvoicesDomainService } from '@domain/supplier-invoices/services/supplier-invoices.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class PurchaseOrdersInvoicesController {
  private readonly logger = new Logger(PurchaseOrdersInvoicesController.name);

  constructor(private readonly service: SupplierInvoicesDomainService) {}

  // Returns the invoices billing the purchase order for the data table
  @MessagePattern({ cmd: 'site.purchaseOrders.invoices.table' })
  table(
    @Payload() data: { purchaseOrderId: string } & TableState,
  ): Promise<{ result: SupplierInvoiceDto[]; count: number }> {
    const { purchaseOrderId, ...state } = data;
    this.logger.log(`site.purchaseOrders.invoices.table — purchaseOrderId: ${purchaseOrderId}`);
    return this.service.findForTable(state, { purchaseOrderId });
  }

  // Rolls the order's live invoices up into counts and the share of the ordered quantity billed
  @MessagePattern({ cmd: 'site.purchaseOrders.invoices.summary' })
  summary(@Payload() data: { purchaseOrderId: string }): Promise<PurchaseOrderInvoiceSummaryDto> {
    this.logger.log(`site.purchaseOrders.invoices.summary — purchaseOrderId: ${data.purchaseOrderId}`);
    return this.service.summaryForPurchaseOrder(data.purchaseOrderId);
  }

  // Records a draft invoice billing the purchase order
  @MessagePattern({ cmd: 'site.purchaseOrders.invoices.create' })
  create(
    @Payload() dto: CreateSupplierInvoiceDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<SupplierInvoiceDto>> {
    this.logger.log(
      `site.purchaseOrders.invoices.create — purchaseOrderId: ${dto.purchaseOrderId}, number: ${dto.invoiceNumber}`,
    );
    return this.service.create(dto, headers.userId || null);
  }
}
