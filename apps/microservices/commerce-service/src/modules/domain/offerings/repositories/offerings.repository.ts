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

export interface ExportOfferingRow {
  code: string;
  name: string;
  description: string | null;
  fulfilmentType: FulfilmentType;
  isActive: boolean;
  legalEntityId: string | null;
  siteId: string | null;
  dimensionCount: number;
  variantCount: number;
}

// What the table renders: the row, whether this workspace owns it, and the two counts shown as columns
export type OfferingTableRow = Offering & {
  isOwned: boolean;
  dimensionCount: number;
  variantCount: number;
};

// The detail page additionally shows how many variants follow the offering's tax class and how many still
// need a bill of materials. Both are correlated subqueries, so they are computed for one row, not for a page.
export type OfferingWithOwnership = OfferingTableRow & {
  variantsFollowingTaxClass: number;
  variantsWithoutBom: number;
};

// A bulk write only has to decide whether it may proceed: ownership, whether any variant exists, and a name
// for the refusal it may have to report
export type OfferingGuardRow = Pick<Offering, 'id' | 'code' | 'name'> & {
  isOwned: boolean;
  variantCount: number;
};

@Injectable()
export class OfferingsDomainRepository extends PrimaryBaseRepository<typeof offerings> {
  constructor(database: PrimaryDatabaseService) {
    super(database, offerings);
  }

  // Each read selects what it shows. A correlated subquery runs once per returned row, so a count only the
  // detail page renders would be computed for every row of a page and thrown away.
  private tableSelection() {
    return {
      ...getColumns(offerings),
      isOwned: ownedByWorkspaceExpression(),
      dimensionCount: this.db.$count(offeringDimensions, eq(offeringDimensions.offeringId, offerings.id)),
      variantCount: this.db.$count(offeringVariants, eq(offeringVariants.offeringId, offerings.id)),
    };
  }

  // One row, so the two extra subqueries cost one evaluation each
  private detailSelection() {
    return {
      ...this.tableSelection(),
      variantsFollowingTaxClass: this.db.$count(
        offeringVariants,
        and(eq(offeringVariants.offeringId, offerings.id), eq(offeringVariants.isTaxClassOverridden, false)),
      ),
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
  // Returns one page of reachable offerings with ownership, plus the unpaginated total
  async findForTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: OfferingTableRow[]; count: number }> {
    return this.findAllAndCount<OfferingTableRow>({
      select: this.tableSelection(),
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns one offering with its ownership flag, or undefined when out of reach. Callers that may
  // only write branch on isOwned rather than narrowing here, so a row owned elsewhere still yields
  // the name their 403 needs — RLS is what actually refuses the write.
  async findDetailById(id: string): Promise<OfferingWithOwnership | undefined> {
    return this.findById<OfferingWithOwnership>(id, { select: this.detailSelection() });
  }

  // Returns the reachable rows among the given ids with only what a bulk guard decides on
  async findByIds(ids: string[]): Promise<OfferingGuardRow[]> {
    if (ids.length === 0) return [];
    return this.findAllWithSelect<OfferingGuardRow>({
      select: {
        id: offerings.id,
        code: offerings.code,
        name: offerings.name,
        isOwned: ownedByWorkspaceExpression(),
        variantCount: this.db.$count(offeringVariants, eq(offeringVariants.offeringId, offerings.id)),
      },
      where: inArray(offerings.id, ids),
      orderBy: [asc(offerings.name)],
    });
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

  // Reads only the columns the export file carries, skipping everything selection() derives
  async findForExport(page: { limit: number; offset: number }): Promise<ExportOfferingRow[]> {
    return this.db
      .select({
        code: offerings.code,
        name: offerings.name,
        description: offerings.description,
        fulfilmentType: offerings.fulfilmentType,
        isActive: offerings.isActive,
        legalEntityId: offerings.legalEntityId,
        siteId: offerings.siteId,
        dimensionCount: this.db.$count(offeringDimensions, eq(offeringDimensions.offeringId, offerings.id)),
        variantCount: this.db.$count(offeringVariants, eq(offeringVariants.offeringId, offerings.id)),
      })
      .from(offerings)
      .orderBy(asc(offerings.name))
      .limit(page.limit)
      .offset(page.offset);
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
