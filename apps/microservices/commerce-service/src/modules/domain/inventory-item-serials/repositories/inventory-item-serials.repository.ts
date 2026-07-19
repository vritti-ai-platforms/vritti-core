import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { inventoryItemSerials } from '@/db/schema';

@Injectable()
export class InventoryItemSerialsDomainRepository extends PrimaryBaseRepository<typeof inventoryItemSerials> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemSerials);
  }
}
