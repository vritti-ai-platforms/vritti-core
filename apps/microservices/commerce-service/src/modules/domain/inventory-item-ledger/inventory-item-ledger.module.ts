import { Module } from '@nestjs/common';
import { InventoryItemLedgerRepository } from './repositories/inventory-item-ledger.repository';
import { InventoryItemLedgerService } from './services/inventory-item-ledger.service';

@Module({
  providers: [InventoryItemLedgerService, InventoryItemLedgerRepository],
  exports: [InventoryItemLedgerService],
})
export class InventoryItemLedgerDomainModule {}
