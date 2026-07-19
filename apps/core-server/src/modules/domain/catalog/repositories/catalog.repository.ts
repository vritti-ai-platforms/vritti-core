import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { desc, eq, inArray } from '@vritti/api-sdk/drizzle-orm';
import { type Catalog, catalogs, type NewCatalog, sites } from '@/db/schema';

@Injectable()
export class CatalogDomainRepository extends PrimaryBaseRepository<typeof catalogs> {
  constructor(database: PrimaryDatabaseService) {
    super(database, catalogs);
  }

  // Finds the single active catalog row
  async findActive(): Promise<Catalog | undefined> {
    return this.model.findFirst({ where: { isActive: true } });
  }

  // Finds a catalog row by its snapshot hash (idempotency key)
  async findByHash(hash: string): Promise<Catalog | undefined> {
    return this.model.findFirst({ where: { hash } });
  }

  // Makes the given row the single active catalog: clears others' isActive, sets this one + activatedAt
  async activate(id: string): Promise<void> {
    await this.transaction(async (tx) => {
      await tx.update(catalogs).set({ isActive: false }).where(eq(catalogs.isActive, true));
      await tx.update(catalogs).set({ isActive: true, activatedAt: new Date() }).where(eq(catalogs.id, id));
    });
  }

  // Inserts a new catalog row and activates it in one transaction
  async insertAndActivate(row: NewCatalog): Promise<Catalog> {
    return this.transaction(async (tx) => {
      await tx.update(catalogs).set({ isActive: false }).where(eq(catalogs.isActive, true));
      const results = (await tx
        .insert(catalogs)
        .values({ ...row, isActive: true, activatedAt: new Date() })
        .returning()) as Catalog[];
      return results[0];
    });
  }

  // Deletes inactive rows beyond the newest n (history retention)
  async pruneKeep(keep = 5): Promise<number> {
    const stale = await this.db
      .select({ id: catalogs.id })
      .from(catalogs)
      .where(eq(catalogs.isActive, false))
      .orderBy(desc(catalogs.createdAt))
      .offset(keep);
    if (stale.length === 0) return 0;

    await this.db.delete(catalogs).where(
      inArray(
        catalogs.id,
        stale.map((r) => r.id),
      ),
    );
    return stale.length;
  }

  // Returns every site id across all organizations (internal cloud request runs without an RLS org context)
  async findAllSiteIds(): Promise<string[]> {
    const rows = await this.db.select({ id: sites.id }).from(sites);
    return rows.map((r) => r.id);
  }
}
