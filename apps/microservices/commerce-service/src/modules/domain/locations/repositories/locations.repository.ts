import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, getColumns, gt, inArray, isNull, ne, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { alias } from '@vritti/api-sdk/drizzle-pg-core';
import {
  currentSiteId,
  goodsReceiptLines,
  inventoryItemLocations,
  inventoryItemQuants,
  inventoryItems,
  inventoryItemUomConversions,
  type LocationRole,
  LocationRoleValues,
  locations,
  storageTypes,
} from '@/db/schema';
import type { LocationRow } from '../dto/entity/location.dto';
import type { FillMemberRow, FillQuantRow } from '../dto/entity/location-fill-inputs.dto';

export type HierarchyRow = {
  id: string;
  parentId: string | null;
  name: string;
  locationRole: LocationRole;
  sortOrder: number;
  depth: number;
  path: string[];
  storageTypeId: string | null;
  storageTypeName: string | null;
  isStorageTypeOverridden: boolean;
};

export type SubtreeRow = {
  id: string;
  parentId: string | null;
  name: string;
  locationRole: LocationRole;
  storageTypeId: string | null;
  isStorageTypeOverridden: boolean;
};

export type StoredItemRow = {
  locationId: string;
  locationName: string;
  inventoryItemId: string;
  inventoryItemName: string;
};

@Injectable()
export class LocationsDomainRepository extends PrimaryBaseRepository<typeof locations> {
  constructor(database: PrimaryDatabaseService) {
    super(database, locations);
  }

  // Returns total storage location count (independent of tree search/filter)
  // Returns true when the location belongs to the named site, else to the request's site
  isAtSite(locationId: string, siteId?: string): Promise<boolean> {
    return this.exists(and(eq(locations.id, locationId), eq(locations.siteId, siteId ?? currentSiteId())) as SQL);
  }

  async countAll(): Promise<number> {
    const [result] = await this.db.select({ count: sql<number>`count(*)` }).from(locations);
    return Number(result?.count ?? 0);
  }

  // Returns a subquery resolving to the location IDs the given inventory item is allowed to use, based on
  // inventory_item_locations rows.
  allowedReservedLocationIdsSubquery(inventoryItemId: string) {
    return this.db
      .select({ id: inventoryItemLocations.locationId })
      .from(inventoryItemLocations)
      .where(eq(inventoryItemLocations.inventoryItemId, inventoryItemId));
  }

  // Returns a subquery resolving to the location IDs already used by lines on the given GR item, scoped to the lot
  // (matching the (item, lot?, location) duplicate-line key).
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
        SELECT tree.id, tree.parent_id AS "parentId", tree.name, tree.location_role AS "locationRole",
               tree.sort_order AS "sortOrder", tree.depth, tree.path,
               l.storage_type_id::text AS "storageTypeId", st.name AS "storageTypeName",
               l.is_storage_type_overridden AS "isStorageTypeOverridden"
        FROM tree
        JOIN ${locations} AS l ON l.id::text = tree.id
        LEFT JOIN ${storageTypes} AS st ON st.id = l.storage_type_id
        ORDER BY tree.ord
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
      SELECT tree.id, tree.parent_id AS "parentId", tree.name, tree.location_role AS "locationRole",
             tree.sort_order AS "sortOrder", tree.depth, tree.path,
             l.storage_type_id::text AS "storageTypeId", st.name AS "storageTypeName",
             l.is_storage_type_overridden AS "isStorageTypeOverridden"
      FROM tree
      JOIN ${locations} AS l ON l.id::text = tree.id
      LEFT JOIN ${storageTypes} AS st ON st.id = l.storage_type_id
      ORDER BY tree.ord
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
      .set({ path: sql`cast(${path} as commerce.ltree)` })
      .where(eq(locations.id, id));
  }

  // Rewrites path prefix for a moved subtree: oldPath -> newPath
  async rewriteSubtreePath(oldPath: string, newPath: string): Promise<void> {
    await this.db.execute(sql`
      UPDATE ${locations}
      SET path = CASE
        WHEN path = cast(${oldPath} as commerce.ltree) THEN cast(${newPath} as commerce.ltree)
        ELSE cast(${newPath} as commerce.ltree) ||
          commerce.subpath(path, commerce.nlevel(cast(${oldPath} as commerce.ltree)))
      END
      WHERE path <@ cast(${oldPath} as commerce.ltree)
    `);
  }

  // Returns one location with its storage type name and the location its type is inherited from
  findDetail(id: string): Promise<LocationRow | undefined> {
    return this.findById<LocationRow>(id, { select: this.selection() });
  }

  // Returns a page of locations with their storage type names and inheritance sources
  findForTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: LocationRow[]; count: number }> {
    return this.findAllAndCount<LocationRow>({ select: this.selection(), ...options });
  }

  // Returns a location and its descendants of the same site, shallowest first
  findSubtree(siteId: string, path: string): Promise<SubtreeRow[]> {
    return this.db
      .select({
        id: locations.id,
        parentId: locations.parentId,
        name: locations.name,
        locationRole: locations.locationRole,
        storageTypeId: locations.storageTypeId,
        isStorageTypeOverridden: locations.isStorageTypeOverridden,
      })
      .from(locations)
      .where(and(eq(locations.siteId, siteId), sql`${locations.path} <@ cast(${path} as commerce.ltree)`))
      .orderBy(sql`commerce.nlevel(${locations.path})`, asc(locations.id));
  }

  // Points the given locations at a storage type, leaving their override flags alone
  async setStorageType(ids: string[], storageTypeId: string | null): Promise<void> {
    if (ids.length === 0) return;
    await this.updateMany(inArray(locations.id, ids), { storageTypeId });
  }

  // Pairs each given location with itself (non-zones) or its descendant storage locations (zones), with their types
  async findFillMembers(locationIds: string[]): Promise<FillMemberRow[]> {
    if (locationIds.length === 0) return [];
    const root = alias(locations, 'fill_root');
    return this.db
      .select({ rootId: root.id, locationId: locations.id, storageTypeId: locations.storageTypeId })
      .from(root)
      .innerJoin(
        locations,
        and(
          eq(locations.siteId, root.siteId),
          sql`${locations.path} <@ ${root.path}`,
          ne(locations.locationRole, LocationRoleValues.ZONE),
        ),
      )
      .where(inArray(root.id, locationIds));
  }

  // Returns the non-empty quants of the given locations with the item's primary unit figures and the pack's own
  // weight and volume
  async findFillQuants(locationIds: string[]): Promise<FillQuantRow[]> {
    if (locationIds.length === 0) return [];
    return this.db
      .select({
        locationId: inventoryItemQuants.locationId,
        inventoryItemId: inventoryItemQuants.inventoryItemId,
        packUomId: inventoryItemQuants.packUomId,
        quantity: inventoryItemQuants.quantity,
        primaryUomId: inventoryItems.uomId,
        primaryWeight: inventoryItems.weight,
        primaryVolume: inventoryItems.volume,
        packWeight: inventoryItemUomConversions.weight,
        packVolume: inventoryItemUomConversions.volume,
      })
      .from(inventoryItemQuants)
      .innerJoin(inventoryItems, eq(inventoryItemQuants.inventoryItemId, inventoryItems.id))
      .leftJoin(
        inventoryItemUomConversions,
        and(
          eq(inventoryItemUomConversions.inventoryItemId, inventoryItemQuants.inventoryItemId),
          eq(inventoryItemUomConversions.uomId, inventoryItemQuants.packUomId),
        ),
      )
      .where(and(inArray(inventoryItemQuants.locationId, locationIds), gt(inventoryItemQuants.quantity, 0)));
  }

  // Returns the distinct items with stock in each of the given locations
  async findStoredItems(locationIds: string[]): Promise<StoredItemRow[]> {
    if (locationIds.length === 0) return [];
    return this.db
      .selectDistinct({
        locationId: locations.id,
        locationName: sql<string>`coalesce(${locations.pathBreadcrumb}, ${locations.name})`,
        inventoryItemId: inventoryItems.id,
        inventoryItemName: inventoryItems.name,
      })
      .from(inventoryItemQuants)
      .innerJoin(locations, eq(inventoryItemQuants.locationId, locations.id))
      .innerJoin(inventoryItems, eq(inventoryItemQuants.inventoryItemId, inventoryItems.id))
      .where(and(inArray(inventoryItemQuants.locationId, locationIds), gt(inventoryItemQuants.quantity, 0)));
  }

  // Selects a location with its storage type name and, when its type is inherited, the nearest ancestor that set it
  private selection() {
    const ancestor = alias(locations, 'type_source');
    const storageTypeName = this.db
      .select({ name: storageTypes.name })
      .from(storageTypes)
      .where(eq(storageTypes.id, locations.storageTypeId));
    const typeSourceName = this.db
      .select({ name: ancestor.name })
      .from(ancestor)
      .where(
        and(
          eq(ancestor.siteId, locations.siteId),
          eq(ancestor.isStorageTypeOverridden, true),
          ne(ancestor.id, locations.id),
          sql`${ancestor.path} @> ${locations.path}`,
        ),
      )
      .orderBy(sql`commerce.nlevel(${ancestor.path}) desc`)
      .limit(1);
    return {
      ...getColumns(locations),
      storageTypeName: sql<string | null>`(${storageTypeName})`,
      inheritedFromLocationName: sql<string | null>`case
        when ${locations.isStorageTypeOverridden} or ${locations.storageTypeId} is null then null
        else (${typeSourceName})
      end`,
    };
  }
}
