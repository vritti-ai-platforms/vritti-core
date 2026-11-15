import type { PurchaseOrderInvoiceSummaryDto } from '@domain/supplier-invoices/dto/entity/purchase-order-invoice-summary.dto';
import type { SupplierInvoiceDto } from '@domain/supplier-invoices/dto/entity/supplier-invoice.dto';
import { SupplierInvoicesDomainService } from '@domain/supplier-invoices/services/supplier-invoices.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';

@Controller()
export class LePurchaseOrdersInvoicesController {
  private readonly logger = new Logger(LePurchaseOrdersInvoicesController.name);

  constructor(private readonly service: SupplierInvoicesDomainService) {}

  // Returns the invoices with a line invoicing the purchase order for the data table
  @MessagePattern({ cmd: 'le.purchaseOrders.invoices.table' })
  table(
    @Payload() data: { purchaseOrderId: string } & TableState,
  ): Promise<{ result: SupplierInvoiceDto[]; count: number }> {
    const { purchaseOrderId, ...state } = data;
    this.logger.log(`le.purchaseOrders.invoices.table — purchaseOrderId: ${purchaseOrderId}`);
    return this.service.findForTable(state, { purchaseOrderId });
  }

  // Rolls up the live invoices invoicing the order and the share of its due quantity invoiced
  @MessagePattern({ cmd: 'le.purchaseOrders.invoices.summary' })
  summary(@Payload() data: { purchaseOrderId: string }): Promise<PurchaseOrderInvoiceSummaryDto> {
    this.logger.log(`le.purchaseOrders.invoices.summary — purchaseOrderId: ${data.purchaseOrderId}`);
    return this.service.summaryForPurchaseOrder(data.purchaseOrderId);
  }
}
