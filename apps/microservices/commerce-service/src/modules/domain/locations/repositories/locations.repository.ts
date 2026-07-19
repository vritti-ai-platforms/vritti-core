import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, inArray, isNull, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  goodsReceiptLines,
  inventoryItemLocations,
  inventoryItemQuants,
  type LocationRole,
  locations,
} from '@/db/schema';

// Hierarchy row consumed by the service's tree builder. The CTE aliases its columns to these
// camelCase names, so the query result maps to this shape directly (no row-mapping step).
export type HierarchyRow = {
  id: string;
  parentId: string | null;
  name: string;
  locationRole: LocationRole;
  sortOrder: number;
  depth: number;
  path: string[];
};

@Injectable()
export class LocationsDomainRepository extends PrimaryBaseRepository<typeof locations> {
  constructor(database: PrimaryDatabaseService) {
    super(database, locations);
  }

  // Returns total storage location count (independent of tree search/filter)
  async countAll(): Promise<number> {
    const [result] = await this.db.select({ count: sql<number>`count(*)` }).from(locations);
    return Number(result?.count ?? 0);
  }

  // Returns a subquery resolving to the location IDs the given inventory item is allowed to use,
  // based on inventory_item_locations rows. Used by the RESERVED_STORAGE filter in findForSelect.
  allowedReservedLocationIdsSubquery(inventoryItemId: string) {
    return this.db
      .select({ id: inventoryItemLocations.locationId })
      .from(inventoryItemLocations)
      .where(eq(inventoryItemLocations.inventoryItemId, inventoryItemId));
  }

  // Returns a subquery resolving to the location IDs already used by lines on the given GR item,
  // scoped to the lot (matching the (item, lot?, location) duplicate-line key). Used by the
  // exclude filter in findForSelect so the GR add-line picker hides bins already taken.
  usedLocationIdsOnGoodsReceiptItemSubquery(goodsReceiptItemId: string, goodsReceiptLotId: string | null) {
    return this.db
      .select({ id: goodsReceiptLines.locationId })
      .from(goodsReceiptLines)
      .where(
        and(
          eq(goodsReceiptLines.goodsReceiptItemId, goodsReceiptItemId),
          goodsReceiptLotId
            ? eq(goodsReceiptLines.goodsReceiptLotId, goodsReceiptLotId)
            : isNull(goodsReceiptLines.goodsReceiptLotId),
        ),
      );
  }

  // Returns hierarchy rows ordered in tree order using a recursive CTE
  async findHierarchyRows(search?: string): Promise<HierarchyRow[]> {
    if (!search) {
      const result = await this.db.execute<HierarchyRow>(sql`
        WITH RECURSIVE tree AS (
          SELECT
            root.id::text AS id,
            root.parent_id::text AS parent_id,
            root.name::text AS name,
            root.location_role::text AS location_role,
            root.sort_order::int AS sort_order,
            0::int AS depth,
            ARRAY[root.id::text] AS path,
            LPAD(root.sort_order::text, 10, '0') || ':' || lower(root.name) || ':' || root.id::text AS ord
          FROM ${locations} AS root
          WHERE root.parent_id IS NULL

          UNION ALL

          SELECT
            child.id::text AS id,
            child.parent_id::text AS parent_id,
            child.name::text AS name,
            child.location_role::text AS location_role,
            child.sort_order::int AS sort_order,
            tree.depth + 1 AS depth,
            tree.path || child.id::text AS path,
            tree.ord || '.' || LPAD(child.sort_order::text, 10, '0') || ':' || lower(child.name) || ':' || child.id::text AS ord
          FROM ${locations} AS child
          JOIN tree ON child.parent_id::text = tree.id
          WHERE NOT (child.id::text = ANY(tree.path))
        )
        SELECT id, parent_id AS "parentId", name, location_role AS "locationRole",
               sort_order AS "sortOrder", depth, path
        FROM tree
        ORDER BY ord
      `);

      return result.rows ?? [];
    }

    const searchPattern = `%${search}%`;
    const result = await this.db.execute<HierarchyRow>(sql`
      WITH RECURSIVE matched AS (
        SELECT
          s.id::text AS id,
          s.parent_id::text AS parent_id
        FROM ${locations} AS s
        WHERE s.name ILIKE ${searchPattern}
      ),
      ancestors AS (
        SELECT id, parent_id
        FROM matched

        UNION ALL

        SELECT
          p.id::text AS id,
          p.parent_id::text AS parent_id
        FROM ${locations} AS p
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
          s.location_role::text AS location_role,
          s.sort_order::int AS sort_order
        FROM ${locations} AS s
        JOIN relevant r ON r.id = s.id::text
        WHERE s.parent_id IS NULL
           OR s.parent_id::text NOT IN (SELECT id FROM relevant)
      ),
      tree AS (
        SELECT
          roots.id,
          roots.parent_id,
          roots.name,
          roots.location_role,
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
          child.location_role::text AS location_role,
          child.sort_order::int AS sort_order,
          tree.depth + 1 AS depth,
          tree.path || child.id::text AS path,
          tree.ord || '.' || LPAD(child.sort_order::text, 10, '0') || ':' || lower(child.name) || ':' || child.id::text AS ord
        FROM ${locations} AS child
        JOIN tree ON child.parent_id::text = tree.id
        JOIN relevant ON relevant.id = child.id::text
        WHERE NOT (child.id::text = ANY(tree.path))
      )
      SELECT id, parent_id AS "parentId", name, location_role AS "locationRole",
             sort_order AS "sortOrder", depth, path
      FROM tree
      ORDER BY ord
    `);

    return result.rows ?? [];
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
      .select({ id: locations.parentId })
      .from(locations)
      .where(inArray(locations.parentId, ids));
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
      .from(locations)
      .where(eq(locations.parentId, id));
    return {
      inventoryLevels: Number(result?.count ?? 0),
      childLocations: Number(children?.count ?? 0),
    };
  }

  // Returns child location IDs for a parent, ordered by sort order and name
  async findChildIdsByParent(parentId: string | null): Promise<string[]> {
    const rows = await this.db
      .select({ id: locations.id })
      .from(locations)
      .where(parentId ? eq(locations.parentId, parentId) : isNull(locations.parentId))
      .orderBy(asc(locations.sortOrder), asc(locations.name));
    return rows.map((row) => row.id);
  }

  // Updates a location sort order
  async updateSortOrder(id: string, sortOrder: number): Promise<void> {
    await this.db.update(locations).set({ sortOrder }).where(eq(locations.id, id));
  }

  // Updates path for a single location
  async updatePath(id: string, path: string): Promise<void> {
    await this.db
      .update(locations)
      .set({ path: sql`cast(${path} as vritti_core.ltree)` })
      .where(eq(locations.id, id));
  }

  // Rewrites path prefix for a moved subtree: oldPath -> newPath
  async rewriteSubtreePath(oldPath: string, newPath: string): Promise<void> {
    await this.db.execute(sql`
      UPDATE ${locations}
      SET path = CASE
        WHEN path = cast(${oldPath} as vritti_core.ltree) THEN cast(${newPath} as vritti_core.ltree)
        ELSE cast(${newPath} as vritti_core.ltree) ||
          vritti_core.subpath(path, vritti_core.nlevel(cast(${oldPath} as vritti_core.ltree)))
      END
      WHERE path <@ cast(${oldPath} as vritti_core.ltree)
    `);
  }

  // Applies location role to a subtree root and all descendants
  async updateLocationRoleForSubtree(rootPath: string, locationRole: LocationRole): Promise<void> {
    await this.db.execute(sql`
      UPDATE ${locations}
      SET location_role = cast(${locationRole} as vritti_core.storage_location_role)
      WHERE path <@ cast(${rootPath} as ltree)
    `);
  }
}
