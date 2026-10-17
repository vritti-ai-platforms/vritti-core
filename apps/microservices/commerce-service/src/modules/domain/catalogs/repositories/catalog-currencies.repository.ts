import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq, inArray, sql } from '@vritti/api-sdk/drizzle-orm';
import { type CatalogCurrency, catalogCurrencies, catalogListingPrices, catalogListings } from '@/db/schema';
import type { CatalogCurrencyCoverageRow } from '../dto/entity/catalog-currency.dto';

@Injectable()
export class CatalogCurrenciesDomainRepository extends PrimaryBaseRepository<typeof catalogCurrencies> {
  constructor(database: PrimaryDatabaseService) {
    super(database, catalogCurrencies);
  }

  async findForCatalog(catalogId: string): Promise<CatalogCurrency[]> {
    return this.db
      .select()
      .from(catalogCurrencies)
      .where(eq(catalogCurrencies.catalogId, catalogId))
      .orderBy(asc(catalogCurrencies.sortOrder), asc(catalogCurrencies.currencyCode));
  }

  // Appended rather than inserted in place: the order currencies were added is the order they are
  // offered, and a shop that adds USD second should not see it jump ahead of INR. Idempotent, so a
  // double-submit adds nothing.
  async addForCatalog(catalogId: string, currencyCode: string): Promise<void> {
    const [last] = (await this.db
      .select({ sortOrder: catalogCurrencies.sortOrder })
      .from(catalogCurrencies)
      .where(eq(catalogCurrencies.catalogId, catalogId))
      .orderBy(desc(catalogCurrencies.sortOrder))
      .limit(1)) as { sortOrder: number }[];

    await this.db
      .insert(catalogCurrencies)
      .values({ catalogId, currencyCode, sortOrder: (last?.sortOrder ?? -1) + 1 })
      .onConflictDoNothing({ target: [catalogCurrencies.catalogId, catalogCurrencies.currencyCode] });
  }

  async removeForCatalog(catalogId: string, currencyCode: string): Promise<number> {
    const rows = (await this.db
      .delete(catalogCurrencies)
      .where(and(eq(catalogCurrencies.catalogId, catalogId), eq(catalogCurrencies.currencyCode, currencyCode)))
      .returning({ id: catalogCurrencies.id })) as { id: string }[];
    return rows.length;
  }

  // What each declared currency actually covers, for the cards on the Prices tab. Left-joined from the
  // declared currency so one that prices nothing still comes back, at zero — that is exactly the state
  // the card has to show. Reach decides which prices count, so this is coverage as this workspace
  // prices it: its own prices plus the ones it inherits.
  async findCoverage(catalogId: string): Promise<CatalogCurrencyCoverageRow[]> {
    return this.db
      .select({
        currencyCode: catalogCurrencies.currencyCode,
        sortOrder: catalogCurrencies.sortOrder,
        pricedCount: sql<number>`count(distinct ${catalogListingPrices.catalogListingId})::int`,
      })
      .from(catalogCurrencies)
      .leftJoin(catalogListings, eq(catalogListings.catalogId, catalogCurrencies.catalogId))
      .leftJoin(
        catalogListingPrices,
        and(
          eq(catalogListingPrices.catalogListingId, catalogListings.id),
          eq(catalogListingPrices.currencyCode, catalogCurrencies.currencyCode),
        ),
      )
      .where(eq(catalogCurrencies.catalogId, catalogId))
      .groupBy(catalogCurrencies.currencyCode, catalogCurrencies.sortOrder)
      .orderBy(asc(catalogCurrencies.sortOrder), asc(catalogCurrencies.currencyCode));
  }

  // How many prices a currency would take with it, so removing one can say what it costs
  async countPrices(catalogId: string, currencyCodes: string[]): Promise<{ currencyCode: string; count: number }[]> {
    if (currencyCodes.length === 0) return [];
    return this.db
      .select({ currencyCode: catalogListingPrices.currencyCode, count: sql<number>`count(*)::int` })
      .from(catalogListingPrices)
      .innerJoin(catalogListings, eq(catalogListings.id, catalogListingPrices.catalogListingId))
      .where(and(eq(catalogListings.catalogId, catalogId), inArray(catalogListingPrices.currencyCode, currencyCodes)))
      .groupBy(catalogListingPrices.currencyCode);
  }
}
