import { PurchasesDomainModule } from '@domain/purchases/purchases.module';
import { SitePurchasingSettingsDomainModule } from '@domain/site-purchasing-settings/site-purchasing-settings.module';
import { Module } from '@nestjs/common';
import { SitePurchasesModule } from '@/modules/site/purchases/purchases.module';
import { LePurchasesAllocationsController } from './allocations/purchases-allocations.controller';
import { LePurchasesItemsController } from './items/purchases-items.controller';
import { LePurchasesLegsController } from './legs/purchases-legs.controller';
import { LePurchasesQuotationsController } from './quotations/purchases-quotations.controller';
import { LePurchasesReceiveWithInvoicesController } from './receive-with-invoices/purchases-receive-with-invoices.controller';
import { LePurchasesRootController } from './root/purchases-root.controller';
import { LePurchasesSettingsController } from './settings/purchases-settings.controller';
import { LePurchasesSupplierInvoicesController } from './supplier-invoices/purchases-supplier-invoices.controller';
import { LePurchasesSuppliersController } from './suppliers/purchases-suppliers.controller';

@Module({
  imports: [SitePurchasesModule, PurchasesDomainModule, SitePurchasingSettingsDomainModule],
  controllers: [
    LePurchasesRootController,
    LePurchasesItemsController,
    LePurchasesQuotationsController,
    LePurchasesAllocationsController,
    LePurchasesSuppliersController,
    LePurchasesLegsController,
    LePurchasesSupplierInvoicesController,
    LePurchasesReceiveWithInvoicesController,
    LePurchasesSettingsController,
  ],
})
export class LePurchasesModule {}
