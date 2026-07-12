import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, inArray, ne, sql } from '@vritti/api-sdk/drizzle-orm';
import { type CatalogChannel, catalogChannels, type SalesChannelKind, salesChannels } from '@/db/schema';

type CatalogChannelRow = {
  id: string;
  catalogId: string;
  siteId: string;
  channelId: string;
  channelName: string;
  channelKind: SalesChannelKind;
};

@Injectable()
export class CatalogChannelsRepository extends PrimaryBaseRepository<typeof catalogChannels> {
  constructor(database: PrimaryDatabaseService) {
    super(database, catalogChannels);
  }

  // Lists a catalog's channel assignments joined with the channel name and kind
  async listByCatalog(catalogId: string): Promise<CatalogChannelRow[]> {
    return this.db
      .select({
        id: catalogChannels.id,
        catalogId: catalogChannels.catalogId,
        siteId: catalogChannels.siteId,
        channelId: catalogChannels.channelId,
        channelName: salesChannels.name,
        channelKind: salesChannels.kind,
      })
      .from(catalogChannels)
      .innerJoin(salesChannels, eq(catalogChannels.channelId, salesChannels.id))
      .where(eq(catalogChannels.catalogId, catalogId))
      .orderBy(asc(salesChannels.name));
  }

  // Inserts a catalog-channel assignment (RLS bu_write guards the site)
  // and returns it joined with the channel name and kind
  async assign(data: { catalogId: string; siteId: string; channelId: string }): Promise<CatalogChannelRow> {
    const [inserted] = (await this.db.insert(catalogChannels).values(data).returning()) as CatalogChannel[];
    const [channel] = await this.db
      .select({ name: salesChannels.name, kind: salesChannels.kind })
      .from(salesChannels)
      .where(eq(salesChannels.id, inserted.channelId));
    return {
      id: inserted.id,
      catalogId: inserted.catalogId,
      siteId: inserted.siteId,
      channelId: inserted.channelId,
      channelName: channel.name,
      channelKind: channel.kind,
    };
  }

  // Removes a catalog-channel assignment by ID
  async unassign(id: string): Promise<void> {
    await this.db.delete(catalogChannels).where(eq(catalogChannels.id, id));
  }

  // Returns a map of catalogId -> assignment count for the catalogs table
  async findCountsByCatalogIds(ids: string[]): Promise<Map<string, number>> {
    if (ids.length === 0) return new Map();
    const rows = await this.db
      .select({
        catalogId: catalogChannels.catalogId,
        count: sql<number>`count(*)`,
      })
      .from(catalogChannels)
      .where(inArray(catalogChannels.catalogId, ids))
      .groupBy(catalogChannels.catalogId);
    return new Map(rows.map((row) => [row.catalogId, Number(row.count)]));
  }

  // Finds the assignment for a site + channel pair (catalog discovery helper)
  async findBySiteAndChannel(siteId: string, channelId: string): Promise<CatalogChannel | undefined> {
    return this.model.findFirst({ where: { siteId, channelId } });
  }

  // Returns the raw channel-assignment rows for a catalog
  async findByCatalogId(catalogId: string): Promise<CatalogChannel[]> {
    return this.model.findMany({ where: { catalogId } });
  }

  // Returns names of channels already mapped to a different catalog for this site
  async findConflictingChannelNames(siteId: string, channelIds: string[], excludeCatalogId: string): Promise<string[]> {
    if (channelIds.length === 0) return [];
    const rows = await this.db
      .select({ name: salesChannels.name })
      .from(catalogChannels)
      .innerJoin(salesChannels, eq(catalogChannels.channelId, salesChannels.id))
      .where(
        and(
          eq(catalogChannels.siteId, siteId),
          inArray(catalogChannels.channelId, channelIds),
          ne(catalogChannels.catalogId, excludeCatalogId),
        ),
      );
    return rows.map((row) => row.name);
  }

  // Removes specific channel assignments from a catalog
  async deleteByCatalogAndChannels(catalogId: string, channelIds: string[]): Promise<void> {
    if (channelIds.length === 0) return;
    await this.db
      .delete(catalogChannels)
      .where(and(eq(catalogChannels.catalogId, catalogId), inArray(catalogChannels.channelId, channelIds)));
  }

  // Bulk-inserts channel assignments (RLS bu_write guards the site)
  async bulkInsert(rows: { catalogId: string; siteId: string; channelId: string }[]): Promise<void> {
    if (rows.length === 0) return;
    await this.db.insert(catalogChannels).values(rows);
  }
}
