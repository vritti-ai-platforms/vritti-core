import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService, type TypedDrizzleClient } from '@vritti/api-sdk/database';
import { and, asc, eq, getColumns, inArray, notExists, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type FulfilmentType,
  type Offering,
  offeringBom,
  offeringDimensions,
  offerings,
  offeringVariants,
  ownedByWorkspaceExpression,
} from '@/db/schema';

export type OfferingWithOwnership = Offering & {
  isOwned: boolean;
  dimensionCount: number;
  variantCount: number;
  variantsWithoutBom: number;
};

@Injectable()
export class OfferingsDomainRepository extends PrimaryBaseRepository<typeof offerings> {
  constructor(database: PrimaryDatabaseService) {
    super(database, offerings);
  }

  // Ownership and the child counts every caller needs, resolved as scalar subqueries in the one
  // select rather than as follow-up round trips
  private selection() {
    return {
      ...getColumns(offerings),
      isOwned: ownedByWorkspaceExpression(),
      dimensionCount: this.db.$count(offeringDimensions, eq(offeringDimensions.offeringId, offerings.id)),
      variantCount: this.db.$count(offeringVariants, eq(offeringVariants.offeringId, offerings.id)),
      variantsWithoutBom: this.db.$count(
        offeringVariants,
        and(
          eq(offeringVariants.offeringId, offerings.id),
          notExists(
            this.db.select({ one: sql`1` }).from(offeringBom).where(eq(offeringBom.variantId, offeringVariants.id)),
          ),
        ),
      ),
    };
  }

  // Returns the offerings this workspace can reach, each flagged with whether it owns the row or
  // merely inherits it from a wider scope (RLS decides reach; ownedByWorkspaceExpression decides ownership)
  async findAll(where?: SQL): Promise<OfferingWithOwnership[]> {
    return this.db.select(this.selection()).from(offerings).where(where).orderBy(asc(offerings.name));
  }

  // Returns one page of reachable offerings with ownership, plus the unpaginated total
  async findForTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: OfferingWithOwnership[]; count: number }> {
    return this.findAllAndCount<OfferingWithOwnership>({
      select: this.selection(),
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns one offering with its ownership flag, or undefined when out of reach. Callers that may
  // only write branch on isOwned rather than narrowing here, so a row owned elsewhere still yields
  // the name their 403 needs — RLS is what actually refuses the write.
  async findById(id: string): Promise<OfferingWithOwnership | undefined> {
    const [row] = await this.db.select(this.selection()).from(offerings).where(eq(offerings.id, id)).limit(1);
    return row;
  }

  // Returns the reachable rows among the given ids, each with ownership
  async findByIds(ids: string[]): Promise<OfferingWithOwnership[]> {
    if (ids.length === 0) return [];
    return this.findAll(inArray(offerings.id, ids));
  }

  // Reports which of the two unique keys are already taken, in one pass. They have different scopes:
  // name is unique per OWNER, code per ORGANIZATION — and a sibling's code is invisible to reach, so
  // the database stays the final arbiter on code.
  async findConflicts(name: string, code: string): Promise<{ nameTaken: boolean; codeTaken: boolean }> {
    const nameMatch = sql`lower(${offerings.name}) = lower(${name}) and ${ownedByWorkspaceExpression()}`;
    const codeMatch = sql`${offerings.code} = ${code}`;

    const [row] = await this.db
      .select({
        nameTaken: sql<boolean>`coalesce(bool_or(${nameMatch}), false)`,
        codeTaken: sql<boolean>`coalesce(bool_or(${codeMatch}), false)`,
      })
      .from(offerings)
      .where(or(nameMatch, codeMatch));

    return row ?? { nameTaken: false, codeTaken: false };
  }

  // Returns the offering matching a name within this workspace's own ownership slot. Scoped to owned
  // rows because name is unique per OWNER, not per organization — an inherited row sharing the name
  // is not a collision.
  async findByName(name: string): Promise<Offering | undefined> {
    const [row] = await this.db
      .select()
      .from(offerings)
      .where(sql`lower(${offerings.name}) = lower(${name}) and ${ownedByWorkspaceExpression()}`)
      .limit(1);
    return row;
  }

  // Flips is_active on many offerings at once; the caller has already checked each one may make the move
  async bulkSetStatus(ids: string[], isActive: boolean): Promise<void> {
    if (ids.length === 0) return;
    await this.db.update(offerings).set({ isActive }).where(inArray(offerings.id, ids));
  }

  // The variants that would break a fulfilment type's bill-of-materials rule if it were applied to
  // them — checked before a cascade writes anything, so the offering never half-moves.
  async findVariantsBreachingBomRule(offeringId: string, max: number, min: number): Promise<string[]> {
    const lineCount = this.db.$count(offeringBom, eq(offeringBom.variantId, offeringVariants.id));
    const rows = await this.db
      .select({ sku: offeringVariants.sku })
      .from(offeringVariants)
      .where(
        and(
          eq(offeringVariants.offeringId, offeringId),
          eq(offeringVariants.isFulfilmentOverridden, false),
          sql`(${lineCount} > ${max} or (${offeringVariants.isActive} and ${lineCount} < ${min}))`,
        ),
      );
    return rows.map((row) => row.sku);
  }

  // Applies a fulfilment type to every variant of an offering except those carrying their own override
  async applyFulfilmentToVariants(
    offeringId: string,
    fulfilmentType: FulfilmentType,
    tx?: TypedDrizzleClient,
  ): Promise<number> {
    const rows = await (tx ?? this.db)
      .update(offeringVariants)
      .set({ fulfilmentType })
      .where(and(eq(offeringVariants.offeringId, offeringId), eq(offeringVariants.isFulfilmentOverridden, false)))
      .returning({ id: offeringVariants.id });
    return rows.length;
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
}
