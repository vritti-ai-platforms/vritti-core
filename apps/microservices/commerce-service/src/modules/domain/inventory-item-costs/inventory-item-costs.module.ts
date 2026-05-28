import { CostCategoriesDomainModule } from '@domain/cost-categories/cost-categories.module';
import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { Module } from '@nestjs/common';
import { InventoryItemCostsRepository } from './repositories/inventory-item-costs.repository';
import { InventoryItemQuantCostsRepository } from './repositories/inventory-item-quant-costs.repository';
import { CostAssociationService } from './services/cost-association.service';

@Module({
  imports: [CostCategoriesDomainModule, GoodsReceiptsDomainModule, InventoryItemQuantsDomainModule],
  providers: [CostAssociationService, InventoryItemCostsRepository, InventoryItemQuantCostsRepository],
  exports: [CostAssociationService, InventoryItemCostsRepository, InventoryItemQuantCostsRepository],
})
export class InventoryItemCostsDomainModule {}
