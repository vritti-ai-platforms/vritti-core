import { InventoryItemLotsDomainModule } from '@domain/inventory-item-lots/inventory-item-lots.module';
import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { InventoryItemSitesDomainModule } from '@domain/inventory-item-sites/inventory-item-sites.module';
import { StockTransfersDomainModule } from '@domain/stock-transfers/stock-transfers.module';
import { Module } from '@nestjs/common';
import { StockTransfersService } from './services/stock-transfers-root.service';
import { StockTransfersController } from './stock-transfers.controller';

@Module({
  imports: [
    StockTransfersDomainModule,
    InventoryItemQuantsDomainModule,
    InventoryItemLotsDomainModule,
    InventoryItemSitesDomainModule,
  ],
  controllers: [StockTransfersController],
  providers: [StockTransfersService],
})
export class SiteStockTransfersModule {}
