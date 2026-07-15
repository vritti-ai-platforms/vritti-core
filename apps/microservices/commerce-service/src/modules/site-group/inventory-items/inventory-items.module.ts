import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { Module } from '@nestjs/common';
import { SiteGroupInventoryItemsController } from './inventory-items.controller';
import { SiteGroupInventoryItemsService } from './services/site-group-inventory-items.service';

@Module({
  imports: [InventoryItemsDomainModule],
  controllers: [SiteGroupInventoryItemsController],
  providers: [SiteGroupInventoryItemsService],
})
export class SiteGroupInventoryItemsModule {}
