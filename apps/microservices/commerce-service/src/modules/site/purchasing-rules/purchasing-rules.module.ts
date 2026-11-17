import { InventoryItemSitesDomainModule } from '@domain/inventory-item-sites/inventory-item-sites.module';
import { PurchaseItemsDomainModule } from '@domain/purchase-items/purchase-items.module';
import { SitePurchasingSettingsDomainModule } from '@domain/site-purchasing-settings/site-purchasing-settings.module';
import { SupplierItemPricesDomainModule } from '@domain/supplier-item-prices/supplier-item-prices.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { Module } from '@nestjs/common';
import { PurchasingRulesService } from './services/purchasing-rules.service';

@Module({
  imports: [
    SitePurchasingSettingsDomainModule,
    InventoryItemSitesDomainModule,
    SupplierItemsDomainModule,
    SupplierItemPricesDomainModule,
    PurchaseItemsDomainModule,
  ],
  providers: [PurchasingRulesService],
  exports: [PurchasingRulesService],
})
export class SitePurchasingRulesModule {}
