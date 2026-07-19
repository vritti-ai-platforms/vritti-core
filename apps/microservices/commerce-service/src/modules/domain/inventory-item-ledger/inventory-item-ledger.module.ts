import { Module } from '@nestjs/common';
import { InventoryItemLedgerDomainRepository } from './repositories/inventory-item-ledger.repository';
import { InventoryItemLedgerDomainService } from './services/inventory-item-ledger.service';

@Module({
  providers: [InventoryItemLedgerDomainService, InventoryItemLedgerDomainRepository],
  exports: [InventoryItemLedgerDomainService],
})
export class InventoryItemLedgerDomainModule {}
