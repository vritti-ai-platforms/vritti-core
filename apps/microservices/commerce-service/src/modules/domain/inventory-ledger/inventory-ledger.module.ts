import { Module } from '@nestjs/common';
import { InventoryLedgerRepository } from './repositories/inventory-ledger.repository';
import { InventoryLedgerService } from './services/inventory-ledger.service';

@Module({
  providers: [InventoryLedgerService, InventoryLedgerRepository],
  exports: [InventoryLedgerService],
})
export class InventoryLedgerDomainModule {}
