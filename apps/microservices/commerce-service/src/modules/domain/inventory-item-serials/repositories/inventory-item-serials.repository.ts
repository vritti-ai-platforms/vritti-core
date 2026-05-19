import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { inventoryItemSerials } from '@/db/schema';

@Injectable()
export class InventoryItemSerialsRepository extends PrimaryBaseRepository<typeof inventoryItemSerials> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemSerials);
  }
}
