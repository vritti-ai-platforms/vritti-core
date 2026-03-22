import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { eq, sql } from '@vritti/api-sdk/drizzle-orm';
import { type Category, categories, products } from '@/db/schema';

@Injectable()
export class CategoryRepository extends PrimaryBaseRepository<typeof categories> {
  constructor(database: PrimaryDatabaseService) {
    super(database, categories);
  }

  // Finds active categories for an org+bu ordered by sortOrder
  async findByOrgAndBu(orgId: string, buId: string): Promise<Category[]> {
    return this.model.findMany({
      where: { organizationId: orgId, businessUnitId: buId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Finds subcategories of a parent category
  async findByParentId(parentId: string): Promise<Category[]> {
    return this.model.findMany({
      where: { parentId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Counts products referencing a category
  async countProductReferences(categoryId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.categoryId, categoryId));
    return (result[0] as { count: number }).count;
  }
}
