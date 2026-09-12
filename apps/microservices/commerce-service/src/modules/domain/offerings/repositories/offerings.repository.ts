import { Injectable } from '@nestjs/common';
import {
  MAX_PAGE_SIZE,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type TypedDrizzleClient,
} from '@vritti/api-sdk/database';
import { and, asc, eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type Offering,
  offeringBom,
  offeringDimensions,
  offeringOwnedByWorkspace,
  offerings,
  offeringVariants,
} from '@/db/schema';

export type OfferingWithMeta = Offering & { isOwned: boolean };

@Injectable()
export class OfferingsDomainRepository extends PrimaryBaseRepository<typeof offerings> {
  constructor(database: PrimaryDatabaseService) {
    super(database, offerings);
  }

  private static selection() {
    return {
      id: offerings.id,
      organizationId: offerings.organizationId,
      legalEntityId: offerings.legalEntityId,
      siteId: offerings.siteId,
      code: offerings.code,
      name: offerings.name,
      description: offerings.description,
      categoryId: offerings.categoryId,
      fulfilmentType: offerings.fulfilmentType,
      taxClassId: offerings.taxClassId,
      isActive: offerings.isActive,
      sortOrder: offerings.sortOrder,
      attributes: offerings.attributes,
      metadata: offerings.metadata,
      createdAt: offerings.createdAt,
      updatedAt: offerings.updatedAt,
      isOwned: offeringOwnedByWorkspace(),
    };
  }

  // Returns every reachable offering with ownership (RLS scopes the rows)
  async findAllWithMeta(where?: SQL): Promise<OfferingWithMeta[]> {
    const { result } = await this.findAllAndCount<OfferingWithMeta>({
      select: OfferingsDomainRepository.selection(),
      where,
      orderBy: [asc(offerings.sortOrder), asc(offerings.name)],
      limit: MAX_PAGE_SIZE,
      offset: 0,
    });
    return result;
  }

  // Returns one page of reachable offerings with ownership, plus the unpaginated total
  async findForTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: OfferingWithMeta[]; count: number }> {
    return this.findAllAndCount<OfferingWithMeta>({
      select: OfferingsDomainRepository.selection(),
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns a single offering with ownership, or undefined when out of reach
  async findByIdWithMeta(id: string): Promise<OfferingWithMeta | undefined> {
    const { result } = await this.findAllAndCount<OfferingWithMeta>({
      select: OfferingsDomainRepository.selection(),
      where: eq(offerings.id, id),
      orderBy: [asc(offerings.name)],
      limit: 1,
      offset: 0,
    });
    return result[0];
  }

  // Returns the name-collision row within the caller's own ownership slot, if any
  async findOwnedByName(name: string): Promise<Offering | undefined> {
    const [row] = await this.db
      .select()
      .from(offerings)
      .where(sql`lower(${offerings.name}) = lower(${name}) and ${offeringOwnedByWorkspace()}`)
      .limit(1);
    return row;
  }

  // Dimension and variant counts for many offerings in one round trip
  async countChildren(
    offeringIds: string[],
  ): Promise<Map<string, { dimensions: number; variants: number; variantsWithoutBom: number }>> {
    const counts = new Map<string, { dimensions: number; variants: number; variantsWithoutBom: number }>();
    if (offeringIds.length === 0) return counts;

    const dims = await this.db
      .select({ offeringId: offeringDimensions.offeringId, n: sql<number>`count(*)::int` })
      .from(offeringDimensions)
      .where(inArray(offeringDimensions.offeringId, offeringIds))
      .groupBy(offeringDimensions.offeringId);

    const vars = await this.db
      .select({ offeringId: offeringVariants.offeringId, n: sql<number>`count(*)::int` })
      .from(offeringVariants)
      .where(inArray(offeringVariants.offeringId, offeringIds))
      .groupBy(offeringVariants.offeringId);

    // A variant with no BOM line cannot be activated, and the overview reports how many are waiting —
    // counted here so that screen never has to pull the whole variant list for one number
    const noBom = await this.db
      .select({ offeringId: offeringVariants.offeringId, n: sql<number>`count(*)::int` })
      .from(offeringVariants)
      .where(
        sql`${inArray(offeringVariants.offeringId, offeringIds)} and not exists (
          select 1 from ${offeringBom} where ${offeringBom.variantId} = ${offeringVariants.id}
        )`,
      )
      .groupBy(offeringVariants.offeringId);

    for (const id of offeringIds) counts.set(id, { dimensions: 0, variants: 0, variantsWithoutBom: 0 });
    for (const row of dims) {
      const entry = counts.get(row.offeringId);
      if (entry) entry.dimensions = row.n;
    }
    for (const row of vars) {
      const entry = counts.get(row.offeringId);
      if (entry) entry.variants = row.n;
    }
    for (const row of noBom) {
      const entry = counts.get(row.offeringId);
      if (entry) entry.variantsWithoutBom = row.n;
    }
    return counts;
  }

  // Returns the reachable rows among the given ids, each with ownership — the batch form of findByIdWithMeta
  async findManyWithMeta(ids: string[]): Promise<OfferingWithMeta[]> {
    if (ids.length === 0) return [];
    return this.findAllWithMeta(inArray(offerings.id, ids));
  }

  // Flips is_active on many offerings at once; the caller has already checked each one may make the move
  async bulkSetStatus(ids: string[], isActive: boolean): Promise<void> {
    if (ids.length === 0) return;
    await this.db.update(offerings).set({ isActive }).where(inArray(offerings.id, ids));
  }

  // Applies a tax class to every variant of an offering except those carrying their own override
  async applyTaxClassToVariants(offeringId: string, taxClassId: string, tx?: TypedDrizzleClient): Promise<number> {
    const rows = await (tx ?? this.db)
      .update(offeringVariants)
      .set({ taxClassId })
      .where(and(eq(offeringVariants.offeringId, offeringId), eq(offeringVariants.isTaxClassOverridden, false)))
      .returning({ id: offeringVariants.id });
    return rows.length;
  }

  // Counts the variants of an offering that hold their own tax class
  async countTaxClassOverrides(offeringId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(offeringVariants)
      .where(and(eq(offeringVariants.offeringId, offeringId), eq(offeringVariants.isTaxClassOverridden, true)));
    return row?.n ?? 0;
  }

  // An offering with variants cannot be deleted — the variants may carry stock or order history
  async countVariants(offeringId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(offeringVariants)
      .where(eq(offeringVariants.offeringId, offeringId));
    return row?.n ?? 0;
  }

  async countDimensions(offeringId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(offeringDimensions)
      .where(eq(offeringDimensions.offeringId, offeringId));
    return row?.n ?? 0;
  }
}
