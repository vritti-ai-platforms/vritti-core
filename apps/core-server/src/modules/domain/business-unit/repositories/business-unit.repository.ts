import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { eq, sql } from '@vritti/api-sdk/drizzle-orm';
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

  // Finds all descendants of a business unit using ltree descendant-of operator (RLS-scoped to current org)
  async findSubtree(path: string): Promise<BusinessUnit[]> {
    const rows = await this.db
      .select()
      .from(businessUnits)
      .where(sql`${businessUnits.path} <@ cast(${path} as vritti_core.ltree)`);
    return rows as BusinessUnit[];
  }

  // Finds all ancestor IDs of a business unit using ltree ancestor-of operator
  async findAncestors(path: string): Promise<string[]> {
    const result = await this.db
      .select({ id: businessUnits.id })
      .from(businessUnits)
      .where(sql`${businessUnits.path} @> cast(${path} as vritti_core.ltree)`);
    return result.map((r) => r.id);
  }

  // Finds all descendant IDs of a business unit using ltree descendant-of operator
  async findDescendants(path: string): Promise<string[]> {
    const result = await this.db
      .select({ id: businessUnits.id })
      .from(businessUnits)
      .where(sql`${businessUnits.path} <@ cast(${path} as vritti_core.ltree)`);
    return result.map((r) => r.id);
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
  async updatePath(id: string, path: string): Promise<BusinessUnit> {
    return this.update(id, { path, updatedAt: new Date() });
  }
}
