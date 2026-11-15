import { PurchasesDomainModule } from '@domain/purchases/purchases.module';
import { Module } from '@nestjs/common';
import { SitePurchasesModule } from '@/modules/site/purchases/purchases.module';
import { LePurchasesAllocationsController } from './allocations/purchases-allocations.controller';
import { LePurchasesItemsController } from './items/purchases-items.controller';
import { LePurchasesLegsController } from './legs/purchases-legs.controller';
import { LePurchasesQuotationsController } from './quotations/purchases-quotations.controller';
import { LePurchasesReceiveWithInvoicesController } from './receive-with-invoices/purchases-receive-with-invoices.controller';
import { LePurchasesRootController } from './root/purchases-root.controller';
import { LePurchasesSourcingController } from './sourcing/purchases-sourcing.controller';
import { LePurchasesSupplierInvoicesController } from './supplier-invoices/purchases-supplier-invoices.controller';
import { LePurchasesSuppliersController } from './suppliers/purchases-suppliers.controller';

@Module({
  imports: [SitePurchasesModule, PurchasesDomainModule],
  controllers: [
    LePurchasesRootController,
    LePurchasesItemsController,
    LePurchasesQuotationsController,
    LePurchasesSourcingController,
    LePurchasesAllocationsController,
    LePurchasesSuppliersController,
    LePurchasesLegsController,
    LePurchasesSupplierInvoicesController,
    LePurchasesReceiveWithInvoicesController,
  ],
})
export class LePurchasesModule {}
