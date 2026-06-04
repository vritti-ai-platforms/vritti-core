import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk';
import { eq, sql } from '@vritti/api-sdk/drizzle-orm';
import { catalogChannels, orders, type SalesChannel, salesChannels } from '@/db/schema';

@Injectable()
export class SalesChannelsRepository extends PrimaryBaseRepository<typeof salesChannels> {
  constructor(database: PrimaryDatabaseService) {
    super(database, salesChannels);
  }

  // Paginated sales-channel options for the selector dropdown
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Lookup by `code` within an org for exact-string matching
  async findByCode(code: string): Promise<SalesChannel | undefined> {
    const [row] = await this.db.select().from(salesChannels).where(eq(salesChannels.code, code)).limit(1);
    return row as SalesChannel | undefined;
  }

  // Counts rows referencing this channel across catalog assignments and orders
  async countReferences(id: string): Promise<number> {
    const [catalogResult, orderResult] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)` }).from(catalogChannels).where(eq(catalogChannels.channelId, id)),
      this.db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.channelId, id)),
    ]);
    return Number(catalogResult[0]?.count ?? 0) + Number(orderResult[0]?.count ?? 0);
  }
}
