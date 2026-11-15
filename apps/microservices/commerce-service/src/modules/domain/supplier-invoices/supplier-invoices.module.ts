import { Module } from '@nestjs/common';
import { InvoiceableGoodsReceiptsRepository } from './repositories/invoiceable-goods-receipts.repository';
import { SupplierInvoiceCostingDomainRepository } from './repositories/supplier-invoice-costing.repository';
import { SupplierInvoiceHoldsDomainRepository } from './repositories/supplier-invoice-holds.repository';
import { SupplierInvoiceLinesDomainRepository } from './repositories/supplier-invoice-lines.repository';
import { SupplierInvoicesDomainRepository } from './repositories/supplier-invoices.repository';
import { SupplierInvoiceCostingDomainService } from './services/supplier-invoice-costing.service';
import { SupplierInvoiceHoldsDomainService } from './services/supplier-invoice-holds.service';
import { SupplierInvoiceLinesDomainService } from './services/supplier-invoice-lines.service';
import { SupplierInvoicesDomainService } from './services/supplier-invoices.service';

@Module({
  providers: [
    SupplierInvoicesDomainService,
    SupplierInvoiceLinesDomainService,
    SupplierInvoiceHoldsDomainService,
    SupplierInvoiceCostingDomainService,
    SupplierInvoicesDomainRepository,
    SupplierInvoiceLinesDomainRepository,
    SupplierInvoiceHoldsDomainRepository,
    SupplierInvoiceCostingDomainRepository,
    InvoiceableGoodsReceiptsRepository,
  ],
  exports: [
    SupplierInvoicesDomainService,
    SupplierInvoiceLinesDomainService,
    SupplierInvoiceHoldsDomainService,
    SupplierInvoiceCostingDomainService,
    SupplierInvoicesDomainRepository,
    SupplierInvoiceLinesDomainRepository,
  ],
})
export class SupplierInvoicesDomainModule {}
