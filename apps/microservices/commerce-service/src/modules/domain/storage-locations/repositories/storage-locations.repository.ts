import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { asc, eq, inArray, isNull, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  inventoryItemQuants,
  type StorageLocationRole,
  storageLocations,
} from '@/db/schema';

@Injectable()
export class StorageLocationsRepository extends PrimaryBaseRepository<typeof storageLocations> {
  constructor(database: PrimaryDatabaseService) {
    super(database, storageLocations);
  }

  // Returns total storage location count (independent of tree search/filter)
  async countAll(): Promise<number> {
    const [result] = await this.db.select({ count: sql<number>`count(*)` }).from(storageLocations);
    return Number(result?.count ?? 0);
  }

  // Returns hierarchy rows ordered in tree order using a recursive CTE
  async findHierarchyRows(search?: string): Promise<
    Array<{ id: string; parentId: string | null; name: string; sortOrder: number; depth: number; path: string[] }>
  > {
    if (!search) {
      const result = await this.db.execute<{
        id: string;
        parent_id: string | null;
        name: string;
        sort_order: number;
        depth: number;
        path: string[];
      }>(sql`
        WITH RECURSIVE tree AS (
          SELECT
            root.id::text AS id,
            root.parent_id::text AS parent_id,
            root.name::text AS name,
            root.sort_order::int AS sort_order,
            0::int AS depth,
            ARRAY[root.id::text] AS path,
            LPAD(root.sort_order::text, 10, '0') || ':' || lower(root.name) || ':' || root.id::text AS ord
          FROM ${storageLocations} AS root
          WHERE root.parent_id IS NULL

          UNION ALL

          SELECT
            child.id::text AS id,
            child.parent_id::text AS parent_id,
            child.name::text AS name,
            child.sort_order::int AS sort_order,
            tree.depth + 1 AS depth,
            tree.path || child.id::text AS path,
            tree.ord || '.' || LPAD(child.sort_order::text, 10, '0') || ':' || lower(child.name) || ':' || child.id::text AS ord
          FROM ${storageLocations} AS child
          JOIN tree ON child.parent_id::text = tree.id
          WHERE NOT (child.id::text = ANY(tree.path))
        )
        SELECT id, parent_id, name, sort_order, depth, path
        FROM tree
        ORDER BY ord
      `);

      const rows = (
        result as {
          rows?: Array<{ id: string; parent_id: string | null; name: string; sort_order: number; depth: number; path: string[] }>;
        }
      ).rows ?? [];
      return rows.map((row) => ({
        id: row.id,
        parentId: row.parent_id,
        name: row.name,
        sortOrder: Number(row.sort_order),
        depth: Number(row.depth),
        path: row.path ?? [row.id],
      }));
    }

    const searchPattern = `%${search}%`;
    const result = await this.db.execute<{
      id: string;
      parent_id: string | null;
      name: string;
      sort_order: number;
      depth: number;
      path: string[];
    }>(sql`
      WITH RECURSIVE matched AS (
        SELECT
          s.id::text AS id,
          s.parent_id::text AS parent_id
        FROM ${storageLocations} AS s
        WHERE s.name ILIKE ${searchPattern}
      ),
      ancestors AS (
        SELECT id, parent_id
        FROM matched

        UNION ALL

        SELECT
          p.id::text AS id,
          p.parent_id::text AS parent_id
        FROM ${storageLocations} AS p
        JOIN ancestors AS a ON a.parent_id = p.id::text
      ),
      relevant AS (
        SELECT DISTINCT id
        FROM ancestors
      ),
      roots AS (
        SELECT
          s.id::text AS id,
          s.parent_id::text AS parent_id,
          s.name::text AS name,
          s.sort_order::int AS sort_order
        FROM ${storageLocations} AS s
        JOIN relevant r ON r.id = s.id::text
        WHERE s.parent_id IS NULL
           OR s.parent_id::text NOT IN (SELECT id FROM relevant)
      ),
      tree AS (
        SELECT
          roots.id,
          roots.parent_id,
          roots.name,
          roots.sort_order,
          0::int AS depth,
          ARRAY[roots.id] AS path,
          LPAD(roots.sort_order::text, 10, '0') || ':' || lower(roots.name) || ':' || roots.id AS ord
        FROM roots

        UNION ALL

        SELECT
          child.id::text AS id,
          child.parent_id::text AS parent_id,
          child.name::text AS name,
          child.sort_order::int AS sort_order,
          tree.depth + 1 AS depth,
          tree.path || child.id::text AS path,
          tree.ord || '.' || LPAD(child.sort_order::text, 10, '0') || ':' || lower(child.name) || ':' || child.id::text AS ord
        FROM ${storageLocations} AS child
        JOIN tree ON child.parent_id::text = tree.id
        JOIN relevant ON relevant.id = child.id::text
        WHERE NOT (child.id::text = ANY(tree.path))
      )
      SELECT id, parent_id, name, sort_order, depth, path
      FROM tree
      ORDER BY ord
    `);

    const rows = (
      result as {
        rows?: Array<{ id: string; parent_id: string | null; name: string; sort_order: number; depth: number; path: string[] }>;
      }
    ).rows ?? [];
    return rows.map((row) => ({
      id: row.id,
      parentId: row.parent_id,
      name: row.name,
      sortOrder: Number(row.sort_order),
      depth: Number(row.depth),
      path: row.path ?? [row.id],
    }));
  }

  // Returns a set of location IDs that are referenced by inventory batches
  async findReferencedIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.db
      .select({ id: inventoryItemQuants.locationId })
      .from(inventoryItemQuants)
      .where(inArray(inventoryItemQuants.locationId, ids));
    const referenced = new Set<string>();
    for (const row of rows) {
      if (row.id) referenced.add(row.id);
    }
    return referenced;
  }

  // Returns a set of location IDs that have child locations
  async findParentIdsWithChildren(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.db
      .select({ id: storageLocations.parentId })
      .from(storageLocations)
      .where(inArray(storageLocations.parentId, ids));
    const parentIds = new Set<string>();
    for (const row of rows) {
      if (row.id) parentIds.add(row.id);
    }
    return parentIds;
  }

  // Counts references to this location across inventory batches
  async countReferences(id: string): Promise<{ inventoryLevels: number; childLocations: number }> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryItemQuants)
      .where(eq(inventoryItemQuants.locationId, id));
    const [children] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(storageLocations)
      .where(eq(storageLocations.parentId, id));
    return {
      inventoryLevels: Number(result?.count ?? 0),
      childLocations: Number(children?.count ?? 0),
    };
  }

  // Returns child location IDs for a parent, ordered by sort order and name
  async findChildIdsByParent(parentId: string | null): Promise<string[]> {
    const rows = await this.db
      .select({ id: storageLocations.id })
      .from(storageLocations)
      .where(parentId ? eq(storageLocations.parentId, parentId) : isNull(storageLocations.parentId))
      .orderBy(asc(storageLocations.sortOrder), asc(storageLocations.name));
    return rows.map((row) => row.id);
  }

  // Updates a location sort order
  async updateSortOrder(id: string, sortOrder: number): Promise<void> {
    await this.db.update(storageLocations).set({ sortOrder }).where(eq(storageLocations.id, id));
  }

  // Updates path for a single location
  async updatePath(id: string, path: string): Promise<void> {
    await this.db
      .update(storageLocations)
      .set({ path: sql`cast(${path} as ltree)` })
      .where(eq(storageLocations.id, id));
  }

  // Rewrites path prefix for a moved subtree: oldPath -> newPath
  async rewriteSubtreePath(oldPath: string, newPath: string): Promise<void> {
    await this.db.execute(sql`
      UPDATE ${storageLocations}
      SET path = CASE
        WHEN path = cast(${oldPath} as ltree) THEN cast(${newPath} as ltree)
        ELSE cast(${newPath} as ltree) || subpath(path, nlevel(cast(${oldPath} as ltree)))
      END
      WHERE path <@ cast(${oldPath} as ltree)
    `);
  }

  // Applies location role to a subtree root and all descendants
  async updateLocationRoleForSubtree(rootPath: string, locationRole: StorageLocationRole): Promise<void> {
    await this.db.execute(sql`
      UPDATE ${storageLocations}
      SET location_role = cast(${locationRole} as vritti_core.storage_location_role)
      WHERE path <@ cast(${rootPath} as ltree)
    `);
  }

}
