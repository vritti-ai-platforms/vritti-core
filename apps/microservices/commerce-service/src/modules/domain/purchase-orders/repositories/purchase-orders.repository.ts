import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import {
  purchaseOrderNumberSeq,
  purchaseOrders,
} from '@/db/schema';

@Injectable()
export class PurchaseOrdersRepository extends PrimaryBaseRepository<typeof purchaseOrders> {
  constructor(database: PrimaryDatabaseService) {
    super(database, purchaseOrders, { sequence: purchaseOrderNumberSeq });
  }

  // Generates a sequential PO number
  async generatePoNumber(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextNumber = await this.nextSequenceValue();
    return `PO-${yearMonth}-${String(nextNumber).padStart(4, '0')}`;
  }
}
