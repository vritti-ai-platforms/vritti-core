import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { eq, sql } from '@vritti/api-sdk/drizzle-orm';
import { type Product, products } from '@/db/schema';

@Injectable()
export class ProductRepository extends PrimaryBaseRepository<typeof products> {
  constructor(database: PrimaryDatabaseService) {
    super(database, products);
  }

  // Finds active products for an org+bu ordered by sortOrder
  async findByOrgAndBu(orgId: string, buId: string): Promise<Product[]> {
    return this.model.findMany({
      where: { organizationId: orgId, businessUnitId: buId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Finds products belonging to a specific category
  async findByCategoryId(categoryId: string): Promise<Product[]> {
    return this.model.findMany({
      where: { categoryId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Counts products referencing a specific category
  async countByCategoryId(categoryId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.categoryId, categoryId));
    return (result[0] as { count: number }).count;
  }

  // Counts products referencing a specific station
  async countByStationId(stationId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.stationId, stationId));
    return (result[0] as { count: number }).count;
  }
}
