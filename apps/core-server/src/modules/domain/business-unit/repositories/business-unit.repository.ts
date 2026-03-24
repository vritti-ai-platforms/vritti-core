import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService, type TypedDrizzleClient } from '@vritti/api-sdk';
import { eq, like, sql } from '@vritti/api-sdk/drizzle-orm';
import { type BusinessUnit, businessUnits } from '@/db/schema';

@Injectable()
export class BusinessUnitRepository extends PrimaryBaseRepository<typeof businessUnits> {
  constructor(database: PrimaryDatabaseService) {
    super(database, businessUnits);
  }

  // Finds all business units for an organization ordered by depth and sort order
  async findByOrg(orgId: string): Promise<BusinessUnit[]> {
    return this.model.findMany({
      where: { organizationId: orgId },
      orderBy: { depth: 'asc', sortOrder: 'asc' },
    });
  }

  // Finds direct children of a parent business unit
  async findChildren(parentId: string): Promise<BusinessUnit[]> {
    return this.model.findMany({
      where: { parentId },
    });
  }

  // Finds all descendants of a business unit using path prefix matching
  async findSubtree(path: string): Promise<BusinessUnit[]> {
    const rows = await this.db
      .select()
      .from(businessUnits)
      .where(like(businessUnits.path, `${path}%`));
    return rows as BusinessUnit[];
  }

  // Counts direct children of a parent business unit
  async countChildren(parentId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(businessUnits)
      .where(eq(businessUnits.parentId, parentId));
    return (result[0] as { count: number }).count;
  }

  // Updates the path for a business unit
  async updatePath(id: string, path: string, tx?: TypedDrizzleClient): Promise<BusinessUnit> {
    return this.update(id, { path, updatedAt: new Date() }, tx);
  }
}
