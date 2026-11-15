import { SupplierInvoicesDomainModule } from '@domain/supplier-invoices/supplier-invoices.module';
import { Module } from '@nestjs/common';
import { SiteSuppliersModule } from '@/modules/site/suppliers/suppliers.module';
import { LeSupplierInvoiceHoldsController } from './holds/supplier-invoice-holds.controller';
import { LeSupplierInvoiceLinesController } from './lines/supplier-invoice-lines.controller';
import { LeSupplierInvoicesRootController } from './root/supplier-invoices-root.controller';

@Module({
  imports: [SiteSuppliersModule, SupplierInvoicesDomainModule],
  controllers: [LeSupplierInvoicesRootController, LeSupplierInvoiceLinesController, LeSupplierInvoiceHoldsController],
})
export class LeSupplierInvoicesModule {}
