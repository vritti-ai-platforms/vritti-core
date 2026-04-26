import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { InventoryLedgerDomainModule } from '@domain/inventory-ledger/inventory-ledger.module';
import { Module } from '@nestjs/common';
import { InventoryItemQuantsController } from './inventory-item-quants.controller';

@Module({
  imports: [InventoryItemQuantsDomainModule, InventoryLedgerDomainModule],
  controllers: [InventoryItemQuantsController],
})
export class InventoryItemQuantsModule {}
