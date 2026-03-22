import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { eq, sql } from '@vritti/api-sdk/drizzle-orm';
import { type Station, products, stations } from '@/db/schema';

@Injectable()
export class StationRepository extends PrimaryBaseRepository<typeof stations> {
  constructor(database: PrimaryDatabaseService) {
    super(database, stations);
  }

  // Finds active stations for an org+bu ordered by sortOrder
  async findByOrgAndBu(orgId: string, buId: string): Promise<Station[]> {
    return this.model.findMany({
      where: { organizationId: orgId, businessUnitId: buId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Counts products referencing a specific station
  async countProductReferences(stationId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.stationId, stationId));
    return (result[0] as { count: number }).count;
  }
}
