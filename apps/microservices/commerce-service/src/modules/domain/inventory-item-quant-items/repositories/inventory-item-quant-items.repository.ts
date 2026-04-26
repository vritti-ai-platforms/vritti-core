import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { inventoryItemQuantItems } from '@/db/schema';

@Injectable()
export class InventoryItemQuantItemsRepository extends PrimaryBaseRepository<typeof inventoryItemQuantItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemQuantItems);
  }
}
