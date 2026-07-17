import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { alias } from '@vritti/api-sdk/drizzle-pg-core';
import { type TaxJurisdiction, taxJurisdictions } from '@/db/schema';

@Injectable()
export class TaxJurisdictionsRepository extends PrimaryBaseRepository<typeof taxJurisdictions> {
  constructor(database: PrimaryDatabaseService) {
    super(database, taxJurisdictions);
  }

  // Returns paginated tax-jurisdiction options for the selector dropdown
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Lookup by `code` within an org for exact-string matching
  async findByCode(code: string): Promise<TaxJurisdiction | undefined> {
    const [row] = await this.db.select().from(taxJurisdictions).where(eq(taxJurisdictions.code, code)).limit(1);
    return row as TaxJurisdiction | undefined;
  }

  // Loads a jurisdiction by id joined with its parent's name (single self-join round trip)
  async findByIdWithParent(id: string): Promise<(TaxJurisdiction & { parentName: string | null }) | undefined> {
    const parent = alias(taxJurisdictions, 'parent');
    const [row] = await this.db
      .select({ jurisdiction: taxJurisdictions, parentName: parent.name })
      .from(taxJurisdictions)
      .leftJoin(parent, eq(parent.id, taxJurisdictions.parentId))
      .where(eq(taxJurisdictions.id, id))
      .limit(1);
    return row ? { ...row.jurisdiction, parentName: row.parentName ?? null } : undefined;
  }

  // Returns total tax-jurisdiction count
  async countAll(): Promise<number> {
    const [result] = await this.db.select({ count: sql<number>`count(*)` }).from(taxJurisdictions);
    return Number(result?.count ?? 0);
  }

  // Returns hierarchy rows ordered in tree order using a recursive CTE (children ordered by name)
  async findHierarchyRows(search?: string): Promise<
    Array<{
      id: string;
      parentId: string | null;
      name: string;
      code: string;
      level: string;
      depth: number;
    }>
  > {
    if (!search) {
      const result = await this.db.execute<{
        id: string;
        parent_id: string | null;
        name: string;
        code: string;
        level: string;
        depth: number;
      }>(sql`
        WITH RECURSIVE tree AS (
          SELECT
            root.id::text AS id,
            root.parent_id::text AS parent_id,
            root.name::text AS name,
            root.code::text AS code,
            root.level::text AS level,
            0::int AS depth,
            ARRAY[root.id::text] AS path,
            lower(root.name) || ':' || root.id::text AS ord
          FROM ${taxJurisdictions} AS root
          WHERE root.parent_id IS NULL

          UNION ALL

          SELECT
            child.id::text AS id,
            child.parent_id::text AS parent_id,
            child.name::text AS name,
            child.code::text AS code,
            child.level::text AS level,
            tree.depth + 1 AS depth,
            tree.path || child.id::text AS path,
            tree.ord || '.' || lower(child.name) || ':' || child.id::text AS ord
          FROM ${taxJurisdictions} AS child
          JOIN tree ON child.parent_id::text = tree.id
          WHERE NOT (child.id::text = ANY(tree.path))
        )
        SELECT id, parent_id, name, code, level, depth
        FROM tree
        ORDER BY ord
      `);

      return this.mapHierarchyRows(result);
    }

    const searchPattern = `%${search}%`;
    const result = await this.db.execute<{
      id: string;
      parent_id: string | null;
      name: string;
      code: string;
      level: string;
      depth: number;
    }>(sql`
      WITH RECURSIVE matched AS (
        SELECT
          j.id::text AS id,
          j.parent_id::text AS parent_id
        FROM ${taxJurisdictions} AS j
        WHERE j.name ILIKE ${searchPattern}
      ),
      ancestors AS (
        SELECT id, parent_id
        FROM matched

        UNION ALL

        SELECT
          p.id::text AS id,
          p.parent_id::text AS parent_id
        FROM ${taxJurisdictions} AS p
        JOIN ancestors AS a ON a.parent_id = p.id::text
      ),
      relevant AS (
        SELECT DISTINCT id
        FROM ancestors
      ),
      roots AS (
        SELECT
          j.id::text AS id,
          j.parent_id::text AS parent_id,
          j.name::text AS name,
          j.code::text AS code,
          j.level::text AS level
        FROM ${taxJurisdictions} AS j
        JOIN relevant r ON r.id = j.id::text
        WHERE j.parent_id IS NULL
           OR j.parent_id::text NOT IN (SELECT id FROM relevant)
      ),
      tree AS (
        SELECT
          roots.id,
          roots.parent_id,
          roots.name,
          roots.code,
          roots.level,
          0::int AS depth,
          ARRAY[roots.id] AS path,
          lower(roots.name) || ':' || roots.id AS ord
        FROM roots

        UNION ALL

        SELECT
          child.id::text AS id,
          child.parent_id::text AS parent_id,
          child.name::text AS name,
          child.code::text AS code,
          child.level::text AS level,
          tree.depth + 1 AS depth,
          tree.path || child.id::text AS path,
          tree.ord || '.' || lower(child.name) || ':' || child.id::text AS ord
        FROM ${taxJurisdictions} AS child
        JOIN tree ON child.parent_id::text = tree.id
        JOIN relevant ON relevant.id = child.id::text
        WHERE NOT (child.id::text = ANY(tree.path))
      )
      SELECT id, parent_id, name, code, level, depth
      FROM tree
      ORDER BY ord
    `);

    return this.mapHierarchyRows(result);
  }

  // Returns paginated child jurisdictions plus total count for the given parent
  findChildren(options?: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: TaxJurisdiction[];
    count: number;
  }> {
    return this.findAllAndCount({
      where: options?.where,
      orderBy: options?.orderBy,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  // Returns the set of jurisdiction IDs that have child jurisdictions
  async findParentIdsWithChildren(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.db
      .select({ id: taxJurisdictions.parentId })
      .from(taxJurisdictions)
      .where(inArray(taxJurisdictions.parentId, ids));
    const parentIds = new Set<string>();
    for (const row of rows) {
      if (row.id) parentIds.add(row.id);
    }
    return parentIds;
  }

  // Returns whether the jurisdiction has any child jurisdictions
  async hasChildren(id: string): Promise<boolean> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(taxJurisdictions)
      .where(eq(taxJurisdictions.parentId, id));
    return Number(result?.count ?? 0) > 0;
  }

  // Normalizes raw recursive-CTE rows into typed hierarchy rows
  private mapHierarchyRows(result: unknown): Array<{
    id: string;
    parentId: string | null;
    name: string;
    code: string;
    level: string;
    depth: number;
  }> {
    const rows =
      (
        result as {
          rows?: Array<{
            id: string;
            parent_id: string | null;
            name: string;
            code: string;
            level: string;
            depth: number;
          }>;
        }
      ).rows ?? [];
    return rows.map((row) => ({
      id: row.id,
      parentId: row.parent_id,
      name: row.name,
      code: row.code,
      level: row.level,
      depth: Number(row.depth),
    }));
  }
}
