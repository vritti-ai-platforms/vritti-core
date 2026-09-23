import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { asc, eq, getColumns, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type Catalog, catalogChannels, catalogListings, catalogs } from '@/db/schema';

export type CatalogWithCounts = Catalog & { items: number; channels: number };

@Injectable()
export class CatalogsDomainRepository extends PrimaryBaseRepository<typeof catalogs> {
  constructor(database: PrimaryDatabaseService) {
    super(database, catalogs);
  }

  // Listing and channel-mapping counts resolved as scalar subqueries in the one select
  private selection() {
    return {
      ...getColumns(catalogs),
      items: this.db.$count(catalogListings, eq(catalogListings.catalogId, catalogs.id)),
      channels: this.db.$count(catalogChannels, eq(catalogChannels.catalogId, catalogs.id)),
    };
  }

  // Returns one page of catalogs plus the unpaginated total
  async findForTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: CatalogWithCounts[]; count: number }> {
    return this.findAllAndCount<CatalogWithCounts>({ ...options, select: this.selection() });
  }

  // Returns every catalog in the organization, for selects
  async findAll(where?: SQL): Promise<CatalogWithCounts[]> {
    return this.db.select(this.selection()).from(catalogs).where(where).orderBy(asc(catalogs.name));
  }

  async findById(id: string): Promise<CatalogWithCounts | undefined> {
    const [row] = await this.db.select(this.selection()).from(catalogs).where(eq(catalogs.id, id)).limit(1);
    return row;
  }

  async findByName(name: string): Promise<Catalog | undefined> {
    const [row] = await this.db.select().from(catalogs).where(sql`lower(${catalogs.name}) = lower(${name})`).limit(1);
    return row;
  }

  async deleteById(id: string): Promise<void> {
    await this.db.delete(catalogs).where(eq(catalogs.id, id));
  }
}
