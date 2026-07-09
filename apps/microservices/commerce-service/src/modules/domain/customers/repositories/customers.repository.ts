import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { eq, sql } from '@vritti/api-sdk/drizzle-orm';
import { customers, orders } from '@/db/schema';

@Injectable()
export class CustomersRepository extends PrimaryBaseRepository<typeof customers> {
  constructor(database: PrimaryDatabaseService) {
    super(database, customers);
  }

  // Returns paginated customer options for the select component
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Counts orders that reference this customer
  async countReferences(id: string): Promise<{ orders: number }> {
    const orderResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.customerId, id));

    return {
      orders: Number(orderResult[0]?.count ?? 0),
    };
  }
}
