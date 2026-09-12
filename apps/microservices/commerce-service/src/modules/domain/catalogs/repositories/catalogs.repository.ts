import { Injectable } from '@nestjs/common';
import { MAX_PAGE_SIZE, PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { asc, eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type Catalog, catalogChannels, catalogListings, catalogs } from '@/db/schema';

@Injectable()
export class CatalogsDomainRepository extends PrimaryBaseRepository<typeof catalogs> {
  constructor(database: PrimaryDatabaseService) {
    super(database, catalogs);
  }

  // Returns one page of catalogs plus the unpaginated total
  async findForTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: Catalog[]; count: number }> {
    return this.findAllAndCount<Catalog>(options);
  }

  // Returns every catalog in the organization, for selects
  async findAll(where?: SQL): Promise<Catalog[]> {
    const { result } = await this.findAllAndCount<Catalog>({
      where,
      orderBy: [asc(catalogs.name)],
      limit: MAX_PAGE_SIZE,
      offset: 0,
    });
    return result;
  }

  async findById(id: string): Promise<Catalog | undefined> {
    return this.model.findFirst({ where: { id } });
  }

  async findByName(name: string): Promise<Catalog | undefined> {
    const [row] = await this.db.select().from(catalogs).where(sql`lower(${catalogs.name}) = lower(${name})`).limit(1);
    return row;
  }

  // Listing and channel-mapping counts for many catalogs in one round trip
  async countChildren(catalogIds: string[]): Promise<Map<string, { items: number; channels: number }>> {
    const counts = new Map<string, { items: number; channels: number }>();
    if (catalogIds.length === 0) return counts;
    for (const id of catalogIds) counts.set(id, { items: 0, channels: 0 });

    const items = await this.db
      .select({ catalogId: catalogListings.catalogId, n: sql<number>`count(*)::int` })
      .from(catalogListings)
      .where(inArray(catalogListings.catalogId, catalogIds))
      .groupBy(catalogListings.catalogId);
    for (const row of items) {
      const entry = counts.get(row.catalogId);
      if (entry) entry.items = row.n;
    }

    const channels = await this.db
      .select({ catalogId: catalogChannels.catalogId, n: sql<number>`count(*)::int` })
      .from(catalogChannels)
      .where(inArray(catalogChannels.catalogId, catalogIds))
      .groupBy(catalogChannels.catalogId);
    for (const row of channels) {
      const entry = counts.get(row.catalogId);
      if (entry) entry.channels = row.n;
    }
    return counts;
  }

  async deleteById(id: string): Promise<void> {
    await this.db.delete(catalogs).where(eq(catalogs.id, id));
  }
}
