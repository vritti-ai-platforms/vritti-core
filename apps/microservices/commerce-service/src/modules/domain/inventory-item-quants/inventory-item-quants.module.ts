import { InventoryItemLotsDomainModule } from '@domain/inventory-item-lots/inventory-item-lots.module';
import { InventoryLedgerDomainModule } from '@domain/inventory-ledger/inventory-ledger.module';
import { Module } from '@nestjs/common';
import { InventoryItemQuantsRepository } from './repositories/inventory-item-quants.repository';
import { InventoryItemQuantsService } from './services/inventory-item-quants.service';

@Module({
  imports: [InventoryLedgerDomainModule, InventoryItemLotsDomainModule],
  providers: [InventoryItemQuantsService, InventoryItemQuantsRepository],
  exports: [InventoryItemQuantsService, InventoryItemQuantsRepository],
})
export class InventoryItemQuantsDomainModule {}
