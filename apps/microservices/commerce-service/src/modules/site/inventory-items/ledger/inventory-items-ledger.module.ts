import { InventoryItemLedgerDomainModule } from '@domain/inventory-item-ledger/inventory-item-ledger.module';
import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { Module } from '@nestjs/common';
import { InventoryItemsLedgerController } from './inventory-items-ledger.controller';
import { InventoryItemsLedgerService } from './services/inventory-items-ledger.service';

@Module({
  imports: [InventoryItemsDomainModule, InventoryItemLedgerDomainModule],
  controllers: [InventoryItemsLedgerController],
  providers: [InventoryItemsLedgerService],
})
export class InventoryItemsLedgerModule {}
