import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, getColumns, gte, isNull, lt, lte, ne, or, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { isBefore, parseISO } from 'date-fns';
import { type TaxClass, type TaxClassGroup, taxClasses, taxClassGroups, taxGroups } from '@/db/schema';

export type TaxClassGroupDetail = TaxClassGroup & {
  taxClassCode: string;
  taxClassName: string;
  taxGroupCode: string;
  taxGroupName: string;
};

export interface TaxClassGroupSlot {
  countryCode: string;
  taxClassId: string;
  maxUnitPrice: bigint | null;
  validFrom: string;
  validTo: string | null;
}

@Injectable()
export class TaxClassGroupsDomainRepository extends PrimaryBaseRepository<typeof taxClassGroups> {
  constructor(database: PrimaryDatabaseService) {
    super(database, taxClassGroups);
  }

  // Loads a class mapping of the given group, throwing when it is not on that group
  async findByIdOrThrow(taxGroupId: string, id: string): Promise<TaxClassGroup> {
    const entity = await this.findById(id, { where: eq(taxClassGroups.taxGroupId, taxGroupId) });
    if (!entity) throw new NotFoundException('Tax class mapping not found.');
    return entity;
  }

  // Loads a mapping of the given class, throwing when it is not on that class
  async findOnClassOrThrow(taxClassId: string, id: string): Promise<TaxClassGroup> {
    const entity = await this.findById(id, { where: eq(taxClassGroups.taxClassId, taxClassId) });
    if (!entity) throw new NotFoundException('Tax class mapping not found.');
    return entity;
  }

  // Loads a class mapping with its class's and group's code and name
  async findDetailOrThrow(id: string): Promise<TaxClassGroupDetail> {
    const entity = await this.findById<TaxClassGroupDetail>(id, { select: this.selection(), innerJoins: this.joins() });
    if (!entity) throw new NotFoundException('Tax class mapping not found.');
    return entity;
  }

  // Returns paginated class mappings with their class and group names, filtered by an already-built where clause
  findDetailsForTable(options: {
    where?: SQL;
    orderBy?: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: TaxClassGroupDetail[]; count: number }> {
    return this.findAllAndCount<TaxClassGroupDetail>({
      select: this.selection(),
      innerJoins: this.joins(),
      ...options,
    });
  }

  // Loads the tax class a mapping names; returns it so callers can name it
  async findClassOrThrow(taxClassId: string): Promise<TaxClass> {
    const [taxClass] = await this.db.select().from(taxClasses).where(eq(taxClasses.id, taxClassId)).limit(1);
    if (taxClass) return taxClass;
    throw new BadRequestException({
      label: 'Tax Class Not Found',
      detail: 'The selected tax class no longer exists. Pick another one.',
      errors: [{ field: 'taxClassId', message: 'Tax class not found' }],
    });
  }

  // Loads the tax class whose mappings are listed, throwing a 404 when it does not exist
  async findParentClassOrThrow(taxClassId: string): Promise<TaxClass> {
    const [taxClass] = await this.db.select().from(taxClasses).where(eq(taxClasses.id, taxClassId)).limit(1);
    if (!taxClass) throw new NotFoundException('Tax class not found.');
    return taxClass;
  }

  // A price limit is a positive unit price, and a mapping's period must not end before it starts
  assertValid(slot: TaxClassGroupSlot): void {
    if (slot.maxUnitPrice !== null && slot.maxUnitPrice <= 0n) {
      throw new BadRequestException({
        label: 'Invalid Price Limit',
        detail: 'A price limit maps the class only up to that unit price, so it must be greater than zero.',
        errors: [{ field: 'maxUnitPrice', message: 'Must be greater than zero' }],
      });
    }
    if (slot.validTo !== null && isBefore(parseISO(slot.validTo), parseISO(slot.validFrom))) {
      throw new BadRequestException({
        label: 'Mapping Ends Before It Starts',
        detail: `The mapping is valid from ${slot.validFrom}, so it cannot end on ${slot.validTo}.`,
        errors: [{ field: 'validTo', message: 'Must be on or after valid from' }],
      });
    }
  }

  // The open-ended mapping of the same country, class and price limit that a later-starting mapping takes over from —
  // it is closed the day before the new mapping starts instead of being reported as an overlap
  async findSupersededOpenEnded(slot: TaxClassGroupSlot): Promise<TaxClassGroup | undefined> {
    const [row] = await this.db
      .select()
      .from(taxClassGroups)
      .where(and(this.sameSlot(slot), isNull(taxClassGroups.validTo), lt(taxClassGroups.validFrom, slot.validFrom)))
      .limit(1);
    return row;
  }

  // Mappings of one country, class and price limit (no limit counts as one limit) never overlap in time; an
  // open-ended mapping runs forever
  async assertPeriodFree(slot: TaxClassGroupSlot, excludeId?: string): Promise<void> {
    const [clash] = await this.db
      .select({ validFrom: taxClassGroups.validFrom, validTo: taxClassGroups.validTo, taxGroupName: taxGroups.name })
      .from(taxClassGroups)
      .innerJoin(taxGroups, eq(taxGroups.id, taxClassGroups.taxGroupId))
      .where(
        and(
          this.sameSlot(slot),
          or(isNull(taxClassGroups.validTo), gte(taxClassGroups.validTo, slot.validFrom)),
          slot.validTo ? lte(taxClassGroups.validFrom, slot.validTo) : undefined,
          excludeId ? ne(taxClassGroups.id, excludeId) : undefined,
        ),
      )
      .limit(1);
    if (!clash) return;
    throw new ConflictException({
      label: 'Overlapping Mapping',
      detail: `This class is already mapped to "${clash.taxGroupName}" in ${slot.countryCode} from ${clash.validFrom} ${clash.validTo ? `to ${clash.validTo}` : 'with no end date'}, at the same price limit. End that mapping first, or choose dates outside it.`,
      errors: [{ field: 'validFrom', message: 'Overlaps another mapping' }],
    });
  }

  // Deletes in one statement; nothing deleted means the mapping is not on this group
  async deleteOrThrow(taxGroupId: string, id: string): Promise<void> {
    const { count } = await this.deleteMany(
      and(eq(taxClassGroups.id, id), eq(taxClassGroups.taxGroupId, taxGroupId)) as SQL,
    );
    if (count === 0) throw new NotFoundException('Tax class mapping not found.');
  }

  // Matches mappings of the same country, class and price limit — no limit counts as one limit
  private sameSlot(slot: TaxClassGroupSlot): SQL | undefined {
    return and(
      eq(taxClassGroups.countryCode, slot.countryCode),
      eq(taxClassGroups.taxClassId, slot.taxClassId),
      slot.maxUnitPrice === null
        ? isNull(taxClassGroups.maxUnitPrice)
        : eq(taxClassGroups.maxUnitPrice, slot.maxUnitPrice),
    );
  }

  // Selects a class mapping with its class's and group's code and name
  private selection() {
    return {
      ...getColumns(taxClassGroups),
      taxClassCode: taxClasses.code,
      taxClassName: taxClasses.name,
      taxGroupCode: taxGroups.code,
      taxGroupName: taxGroups.name,
    };
  }

  // Joins the class and the group every mapping names
  private joins() {
    return [
      { table: taxClasses, on: eq(taxClasses.id, taxClassGroups.taxClassId) },
      { table: taxGroups, on: eq(taxGroups.id, taxClassGroups.taxGroupId) },
    ];
  }
}
