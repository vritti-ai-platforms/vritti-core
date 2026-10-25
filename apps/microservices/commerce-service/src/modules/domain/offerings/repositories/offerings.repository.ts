import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService, type TypedDrizzleClient } from '@vritti/api-sdk/database';
import {
  and,
  asc,
  countDistinct,
  desc,
  eq,
  getColumns,
  inArray,
  isNull,
  notExists,
  or,
  type SQL,
  sql,
} from '@vritti/api-sdk/drizzle-orm';
import {
  type CatalogChannelType,
  catalogChannels,
  catalogListingChannelExclusions,
  catalogListings,
  catalogs,
  channelSpecificity,
  type FulfilmentType,
  type Offering,
  offeringBom,
  offeringDimensions,
  offerings,
  offeringVariants,
  ownedByWorkspaceExpression,
  posTerminals,
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

export type OfferingTableRow = Offering & {
  isOwned: boolean;
  dimensionCount: number;
  variantCount: number;
};

export interface ChannelSlotRow {
  channelId: string;
  type: CatalogChannelType;
  appId: string | null;
  terminalId: string | null;
  terminalName: string | null;
  catalogId: string;
  catalogName: string;
  isOwn: boolean;
  legalEntityId: string | null;
  siteId: string | null;
}

export interface ChannelTarget {
  id: string;
  name: string;
  kind: 'APP' | 'TERMINAL';
}

export interface OfferingTargetRow {
  type: CatalogChannelType;
  targetId: string;
  targetName: string;
  targetKind: 'APP' | 'TERMINAL';
  catalogId: string;
  catalogName: string;
  isAssigned: boolean;
  isOwn: boolean;
  variants: number;
  listed: number;
  available: number;
}

export interface ChannelListedCountRow {
  channelId: string;
  listed: number;
}

export interface OfferingExclusionRow {
  channelId: string;
  appId: string | null;
  terminalId: string | null;
  variantId: string;
}

export type OfferingWithOwnership = OfferingTableRow & {
  variantsFollowingTaxClass: number;
  variantsWithoutBom: number;
};

export type OfferingGuardRow = Pick<Offering, 'id' | 'code' | 'name'> & {
  isOwned: boolean;
  variantCount: number;
};

@Injectable()
export class OfferingsDomainRepository extends PrimaryBaseRepository<typeof offerings> {
  constructor(database: PrimaryDatabaseService) {
    super(database, offerings);
  }

  // Each read selects what it shows.
  private tableSelection() {
    return {
      ...getColumns(offerings),
      isOwned: ownedByWorkspaceExpression(offerings),
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

  // Returns one page of reachable offerings, each flagged with whether this workspace owns it, plus the total
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

  // Returns one offering with its ownership flag, or undefined when out of reach.
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
        isOwned: ownedByWorkspaceExpression(offerings),
        variantCount: this.db.$count(offeringVariants, eq(offeringVariants.offeringId, offerings.id)),
      },
      where: inArray(offerings.id, ids),
      orderBy: [asc(offerings.name)],
    });
  }

  // Reports which of the two unique keys are already taken, in one pass.
  async findConflicts(name: string, code: string): Promise<{ nameTaken: boolean; codeTaken: boolean }> {
    const nameMatch = sql`lower(${offerings.name}) = lower(${name}) and ${ownedByWorkspaceExpression(offerings)}`;
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

  // Returns the offering matching a name within this workspace's own ownership slot.
  async findByName(name: string): Promise<Offering | undefined> {
    const [row] = await this.db
      .select()
      .from(offerings)
      .where(sql`lower(${offerings.name}) = lower(${name}) and ${ownedByWorkspaceExpression(offerings)}`)
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

  // The variants that would break a fulfilment type's bill-of-materials rule if it were applied to them — checked
  // before a cascade writes anything, so the offering never half-moves.
  // Every channel this workspace can reach, with the catalog it carries. Small by nature — one row per type
  // per target per level — so the ranking that picks a target's channel is done over these in the service.
  async findChannelSlots(): Promise<ChannelSlotRow[]> {
    return this.db
      .select({
        channelId: catalogChannels.id,
        type: catalogChannels.type,
        appId: catalogChannels.appId,
        terminalId: catalogChannels.terminalId,
        terminalName: posTerminals.name,
        catalogId: catalogChannels.catalogId,
        catalogName: catalogs.name,
        isOwn: ownedByWorkspaceExpression(catalogChannels),
        legalEntityId: catalogChannels.legalEntityId,
        siteId: catalogChannels.siteId,
      })
      .from(catalogChannels)
      .innerJoin(catalogs, eq(catalogs.id, catalogChannels.catalogId))
      .leftJoin(posTerminals, eq(posTerminals.id, catalogChannels.terminalId))
      .orderBy(desc(channelSpecificity));
  }

  // The tills this workspace can see, which are POS targets the way apps are storefront targets
  async findPosTerminals(): Promise<{ id: string; name: string }[]> {
    return this.db
      .select({ id: posTerminals.id, name: posTerminals.name })
      .from(posTerminals)
      .orderBy(asc(posTerminals.name));
  }

  // How many live variants of this offering each channel's catalog carries
  async findListedCountsByChannel(offeringId: string): Promise<ChannelListedCountRow[]> {
    return this.db
      .select({
        channelId: catalogChannels.id,
        listed: countDistinct(offeringVariants.id),
      })
      .from(catalogChannels)
      .innerJoin(catalogListings, eq(catalogListings.catalogId, catalogChannels.catalogId))
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .where(
        and(
          eq(offeringVariants.offeringId, offeringId),
          eq(offeringVariants.isActive, true),
          eq(offeringVariants.isOfferingActive, true),
        ),
      )
      .groupBy(catalogChannels.id);
  }

  // The outright exclusions standing against this offering, each naming the channel and the target it is for.
  // One naming no target is the channel's own and so counts against every target that inherits it.
  async findOfferingExclusions(offeringId: string): Promise<OfferingExclusionRow[]> {
    return this.db
      .select({
        channelId: catalogListingChannelExclusions.catalogChannelId,
        appId: catalogListingChannelExclusions.appId,
        terminalId: catalogListingChannelExclusions.terminalId,
        variantId: offeringVariants.id,
      })
      .from(catalogListingChannelExclusions)
      .innerJoin(catalogListings, eq(catalogListings.id, catalogListingChannelExclusions.catalogListingId))
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .where(
        and(
          eq(offeringVariants.offeringId, offeringId),
          eq(offeringVariants.isActive, true),
          eq(offeringVariants.isOfferingActive, true),
          isNull(catalogListingChannelExclusions.currencyCode),
        ),
      );
  }

  // How many variants this offering has at all, the denominator every target's counts read against
  async countVariants(offeringId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: countDistinct(offeringVariants.id) })
      .from(offeringVariants)
      .where(eq(offeringVariants.offeringId, offeringId));
    return row?.count ?? 0;
  }

  async findVariantsBreachingBomRule(offeringId: string, max: number, min: number): Promise<string[]> {
    const lineCount = this.db.$count(offeringBom, eq(offeringBom.variantId, offeringVariants.id));
    const rows = await this.db
      .select({ code: offeringVariants.code })
      .from(offeringVariants)
      .where(
        and(
          eq(offeringVariants.offeringId, offeringId),
          eq(offeringVariants.isFulfilmentOverridden, false),
          sql`(${lineCount} > ${max} or (${offeringVariants.isActive} and ${lineCount} < ${min}))`,
        ),
      );
    return rows.map((row) => row.code);
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
