import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk';
import { asc, eq, inArray, isNull, sql } from '@vritti/api-sdk/drizzle-orm';
import { categories, inventoryItems, offerings } from '@/db/schema';

@Injectable()
export class CategoriesRepository extends PrimaryBaseRepository<typeof categories> {
  constructor(database: PrimaryDatabaseService) {
    super(database, categories);
  }

  // Returns paginated category options for the select component
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Returns total category count
  async countAll(): Promise<number> {
    const [result] = await this.db.select({ count: sql<number>`count(*)` }).from(categories);
    return Number(result?.count ?? 0);
  }

  // Returns hierarchy rows ordered in tree order using a recursive CTE
  async findHierarchyRows(
    search?: string,
  ): Promise<Array<{ id: string; parentId: string | null; name: string; sortOrder: number; depth: number }>> {
    if (!search) {
      const result = await this.db.execute<{
        id: string;
        parent_id: string | null;
        name: string;
        sort_order: number;
        depth: number;
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
          FROM ${categories} AS root
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
          FROM ${categories} AS child
          JOIN tree ON child.parent_id::text = tree.id
          WHERE NOT (child.id::text = ANY(tree.path))
        )
        SELECT id, parent_id, name, sort_order, depth
        FROM tree
        ORDER BY ord
      `);

      const rows =
        (
          result as {
            rows?: Array<{ id: string; parent_id: string | null; name: string; sort_order: number; depth: number }>;
          }
        ).rows ?? [];
      return rows.map((row) => ({
        id: row.id,
        parentId: row.parent_id,
        name: row.name,
        sortOrder: Number(row.sort_order),
        depth: Number(row.depth),
      }));
    }

    const searchPattern = `%${search}%`;
    const result = await this.db.execute<{
      id: string;
      parent_id: string | null;
      name: string;
      sort_order: number;
      depth: number;
    }>(sql`
      WITH RECURSIVE matched AS (
        SELECT
          c.id::text AS id,
          c.parent_id::text AS parent_id
        FROM ${categories} AS c
        WHERE c.name ILIKE ${searchPattern}
      ),
      ancestors AS (
        SELECT id, parent_id
        FROM matched

        UNION ALL

        SELECT
          p.id::text AS id,
          p.parent_id::text AS parent_id
        FROM ${categories} AS p
        JOIN ancestors AS a ON a.parent_id = p.id::text
      ),
      relevant AS (
        SELECT DISTINCT id
        FROM ancestors
      ),
      roots AS (
        SELECT
          c.id::text AS id,
          c.parent_id::text AS parent_id,
          c.name::text AS name,
          c.sort_order::int AS sort_order
        FROM ${categories} AS c
        JOIN relevant r ON r.id = c.id::text
        WHERE c.parent_id IS NULL
           OR c.parent_id::text NOT IN (SELECT id FROM relevant)
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
        FROM ${categories} AS child
        JOIN tree ON child.parent_id::text = tree.id
        JOIN relevant ON relevant.id = child.id::text
        WHERE NOT (child.id::text = ANY(tree.path))
      )
      SELECT id, parent_id, name, sort_order, depth
      FROM tree
      ORDER BY ord
    `);

    const rows =
      (
        result as {
          rows?: Array<{ id: string; parent_id: string | null; name: string; sort_order: number; depth: number }>;
        }
      ).rows ?? [];
    return rows.map((row) => ({
      id: row.id,
      parentId: row.parent_id,
      name: row.name,
      sortOrder: Number(row.sort_order),
      depth: Number(row.depth),
    }));
  }

  // Returns a set of category IDs that are referenced by catalog or inventory items
  async findReferencedIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const [itemRows, inventoryItemRows] = await Promise.all([
      this.db.select({ id: offerings.categoryId }).from(offerings).where(inArray(offerings.categoryId, ids)),
      this.db
        .select({ id: inventoryItems.categoryId })
        .from(inventoryItems)
        .where(inArray(inventoryItems.categoryId, ids)),
    ]);
    const referenced = new Set<string>();
    for (const row of [...itemRows, ...inventoryItemRows]) {
      if (row.id) referenced.add(row.id);
    }
    return referenced;
  }

  // Returns a set of category IDs that have child categories
  async findParentIdsWithChildren(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.db
      .select({ id: categories.parentId })
      .from(categories)
      .where(inArray(categories.parentId, ids));
    const parentIds = new Set<string>();
    for (const row of rows) {
      if (row.id) parentIds.add(row.id);
    }
    return parentIds;
  }

  // Counts references to this category across items, inventory items, and child categories
  async countReferences(id: string): Promise<{ items: number; inventoryItems: number; childCategories: number }> {
    const [itemRefs] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(offerings)
      .where(eq(offerings.categoryId, id));

    const [inventoryItemRefs] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryItems)
      .where(eq(inventoryItems.categoryId, id));

    const [childRefs] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(eq(categories.parentId, id));

    return {
      items: Number(itemRefs?.count ?? 0),
      inventoryItems: Number(inventoryItemRefs?.count ?? 0),
      childCategories: Number(childRefs?.count ?? 0),
    };
  }

  // Returns child category IDs for a parent, ordered by sort order and name
  async findChildIdsByParent(parentId: string | null): Promise<string[]> {
    const rows = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(parentId ? eq(categories.parentId, parentId) : isNull(categories.parentId))
      .orderBy(asc(categories.sortOrder), asc(categories.name));
    return rows.map((row) => row.id);
  }

  // Updates a category sort order
  async updateSortOrder(id: string, sortOrder: number): Promise<void> {
    await this.db.update(categories).set({ sortOrder }).where(eq(categories.id, id));
  }

  // Sets the ltree path for a single category (used for the two-phase create pattern)
  async updatePath(id: string, path: string): Promise<void> {
    await this.db
      .update(categories)
      .set({ path: sql`cast(${path} as vritti_core.ltree)` })
      .where(eq(categories.id, id));
  }

  // Rewrites path prefix for a moved/renamed subtree: oldPath -> newPath
  async rewriteSubtreePath(oldPath: string, newPath: string): Promise<void> {
    await this.db.execute(sql`
      UPDATE ${categories}
      SET path = CASE
        WHEN path = cast(${oldPath} as vritti_core.ltree) THEN cast(${newPath} as vritti_core.ltree)
        ELSE cast(${newPath} as vritti_core.ltree) || subpath(path, nlevel(cast(${oldPath} as vritti_core.ltree)))
      END
      WHERE path <@ cast(${oldPath} as vritti_core.ltree)
    `);
  }

  // Counts items + inventory items linked directly to a category (used to block child creation)
  async countItemsForCategory(categoryId: string): Promise<number> {
    const [itemRefs] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(offerings)
      .where(eq(offerings.categoryId, categoryId));
    const [inventoryItemRefs] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryItems)
      .where(eq(inventoryItems.categoryId, categoryId));
    return Number(itemRefs?.count ?? 0) + Number(inventoryItemRefs?.count ?? 0);
  }

  // Counts direct children of a category (used by assertIsLeaf)
  async countChildren(categoryId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(eq(categories.parentId, categoryId));
    return Number(result?.count ?? 0);
  }
}
