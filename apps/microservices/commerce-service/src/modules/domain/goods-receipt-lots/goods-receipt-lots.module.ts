import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { InventoryItemLotsDomainModule } from '@domain/inventory-item-lots/inventory-item-lots.module';
import { Module } from '@nestjs/common';
import { GoodsReceiptLotsDomainRepository } from './repositories/goods-receipt-lots.repository';
import { GoodsReceiptLotsDomainService } from './services/goods-receipt-lots.service';

@Module({
  imports: [GoodsReceiptsDomainModule, InventoryItemLotsDomainModule],
  providers: [GoodsReceiptLotsDomainService, GoodsReceiptLotsDomainRepository],
  exports: [GoodsReceiptLotsDomainService, GoodsReceiptLotsDomainRepository],
})
export class GoodsReceiptLotsDomainModule {}
