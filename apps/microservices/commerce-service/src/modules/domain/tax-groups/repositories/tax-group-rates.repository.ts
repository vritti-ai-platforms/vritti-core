import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import {
  and,
  eq,
  getColumns,
  gte,
  isNull,
  lt,
  lte,
  ne,
  notExists,
  or,
  type SQL,
  sql,
} from '@vritti/api-sdk/drizzle-orm';
import { type AnyPgColumn, alias } from '@vritti/api-sdk/drizzle-pg-core';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { isBefore, parseISO } from 'date-fns';
import {
  type TaxCalculation,
  TaxCalculationValues,
  type TaxComponent,
  type TaxGroupRate,
  type TaxJurisdiction,
  type TaxJurisdictionCheck,
  type TaxMeasure,
  taxComponents,
  taxGroupRates,
  taxJurisdictions,
} from '@/db/schema';

export type TaxGroupRateDetail = TaxGroupRate & {
  taxComponentCode: string;
  taxComponentName: string;
  jurisdictionName: string | null;
};

export interface TaxGroupRateSlot {
  taxGroupId: string;
  taxComponentId: string;
  jurisdictionId: string | null;
  jurisdictionCheck: TaxJurisdictionCheck | null;
  validFrom: string;
  validTo: string | null;
}

export interface TaxGroupRateContext {
  jurisdictionId?: string;
  asOf?: string;
}

export interface TaxGroupRateValues {
  calculation: TaxCalculation;
  rate: number | null;
  amount: bigint | null;
  measure: TaxMeasure | null;
  validFrom: string;
  validTo: string | null;
}

@Injectable()
export class TaxGroupRatesDomainRepository extends PrimaryBaseRepository<typeof taxGroupRates> {
  constructor(database: PrimaryDatabaseService) {
    super(database, taxGroupRates);
  }

  // Loads a rate of the given group, throwing when it is not on that group
  async findByIdOrThrow(taxGroupId: string, id: string): Promise<TaxGroupRate> {
    const entity = await this.findById(id, { where: eq(taxGroupRates.taxGroupId, taxGroupId) });
    if (!entity) throw new NotFoundException('Tax rate not found.');
    return entity;
  }

  // Loads a rate with its component's code and name and its jurisdiction's name
  async findDetailOrThrow(id: string): Promise<TaxGroupRateDetail> {
    const entity = await this.findById<TaxGroupRateDetail>(id, {
      select: this.selection(),
      innerJoins: this.innerJoins(),
      leftJoins: this.leftJoins(),
    });
    if (!entity) throw new NotFoundException('Tax rate not found.');
    return entity;
  }

  // Returns paginated rates with their component and jurisdiction names, filtered by an already-built where clause
  // and narrowed to the rates that apply in a state and on a day when the context names them
  findDetailsForTable(options: {
    where?: SQL;
    context: TaxGroupRateContext;
    orderBy?: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: TaxGroupRateDetail[]; count: number }> {
    const { where, context, ...page } = options;
    return this.findAllAndCount<TaxGroupRateDetail>({
      select: this.selection(),
      innerJoins: this.innerJoins(),
      leftJoins: this.leftJoins(),
      where: and(
        where,
        context.asOf ? this.validOn(taxGroupRates, context.asOf) : undefined,
        context.jurisdictionId ? this.appliesIn(context.jurisdictionId, context.asOf) : undefined,
      ),
      ...page,
    });
  }

  // A rate's component must be one of its group's country; returns the component so callers can name it
  async findComponentOrThrow(taxComponentId: string, countryCode: string): Promise<TaxComponent> {
    const [component] = await this.db.select().from(taxComponents).where(eq(taxComponents.id, taxComponentId)).limit(1);
    if (!component) {
      throw new BadRequestException({
        label: 'Tax Component Not Found',
        detail: 'The selected tax component no longer exists. Pick another one.',
        errors: [{ field: 'taxComponentId', message: 'Component not found' }],
      });
    }
    if (component.countryCode !== countryCode) {
      throw new BadRequestException({
        label: 'Component In Another Country',
        detail: `${component.name} is a ${component.countryCode} tax component, and this group taxes ${countryCode}. Pick a ${countryCode} component.`,
        errors: [{ field: 'taxComponentId', message: `Not in ${countryCode}` }],
      });
    }
    return component;
  }

  // A rate without a jurisdiction applies to the whole country; a named one must lie in the group's country
  async findJurisdictionOrThrow(jurisdictionId: string | null, countryCode: string): Promise<TaxJurisdiction | null> {
    if (!jurisdictionId) return null;
    const [jurisdiction] = await this.db
      .select()
      .from(taxJurisdictions)
      .where(eq(taxJurisdictions.id, jurisdictionId))
      .limit(1);
    if (!jurisdiction) {
      throw new BadRequestException({
        label: 'Jurisdiction Not Found',
        detail: 'The selected jurisdiction no longer exists. Pick another one.',
        errors: [{ field: 'jurisdictionId', message: 'Jurisdiction not found' }],
      });
    }
    if (jurisdiction.countryCode !== countryCode) {
      throw new BadRequestException({
        label: 'Jurisdiction In Another Country',
        detail: `${jurisdiction.name} is in ${jurisdiction.countryCode}, and this group taxes ${countryCode}. Pick a jurisdiction in ${countryCode}.`,
        errors: [{ field: 'jurisdictionId', message: `Not in ${countryCode}` }],
      });
    }
    return jurisdiction;
  }

  // A percent rate carries a rate and nothing else; an amount-per-measure rate carries a non-negative amount and its
  // measure and no rate. Either way the period must not end before it starts
  assertValid(values: TaxGroupRateValues): void {
    const errors: { field: string; message: string }[] = [];
    if (values.calculation === TaxCalculationValues.PERCENT) {
      if (values.rate === null) errors.push({ field: 'rate', message: 'Rate is required' });
      if (values.amount !== null) errors.push({ field: 'amount', message: 'Not used for a percent rate' });
      if (values.measure !== null) errors.push({ field: 'measure', message: 'Not used for a percent rate' });
    } else {
      if (values.amount === null) errors.push({ field: 'amount', message: 'Amount is required' });
      else if (values.amount < 0n) errors.push({ field: 'amount', message: 'Must not be negative' });
      if (values.measure === null) errors.push({ field: 'measure', message: 'Measure is required' });
      if (values.rate !== null) errors.push({ field: 'rate', message: 'Not used for an amount rate' });
    }
    if (errors.length > 0) {
      throw new BadRequestException({
        label: 'Rate Does Not Match Its Calculation',
        detail:
          values.calculation === TaxCalculationValues.PERCENT
            ? 'A percent rate takes a rate between 0 and 999.9999, and no amount or measure.'
            : 'An amount-per-measure rate takes an amount and the measure it is charged on, and no rate.',
        errors,
      });
    }
    if (values.validTo !== null && isBefore(parseISO(values.validTo), parseISO(values.validFrom))) {
      throw new BadRequestException({
        label: 'Rate Ends Before It Starts',
        detail: `The rate is valid from ${values.validFrom}, so it cannot end on ${values.validTo}.`,
        errors: [{ field: 'validTo', message: 'Must be on or after valid from' }],
      });
    }
  }

  // The open-ended rate of the same group, component, place and jurisdiction check that a later-starting rate takes over
  // from — it is closed the day before the new rate starts instead of being reported as an overlap
  async findSupersededOpenEnded(slot: TaxGroupRateSlot): Promise<TaxGroupRate | undefined> {
    const [row] = await this.db
      .select()
      .from(taxGroupRates)
      .where(and(this.sameSlot(slot), isNull(taxGroupRates.validTo), lt(taxGroupRates.validFrom, slot.validFrom)))
      .limit(1);
    return row;
  }

  // Rates of one group, component, place and jurisdiction check (none counts as one value of each) never overlap in
  // time; an open-ended rate runs forever
  async assertPeriodFree(slot: TaxGroupRateSlot, excludeId?: string): Promise<void> {
    const [clash] = await this.db
      .select({ validFrom: taxGroupRates.validFrom, validTo: taxGroupRates.validTo })
      .from(taxGroupRates)
      .where(
        and(
          this.sameSlot(slot),
          or(isNull(taxGroupRates.validTo), gte(taxGroupRates.validTo, slot.validFrom)),
          slot.validTo ? lte(taxGroupRates.validFrom, slot.validTo) : undefined,
          excludeId ? ne(taxGroupRates.id, excludeId) : undefined,
        ),
      )
      .limit(1);
    if (!clash) return;
    throw new ConflictException({
      label: 'Overlapping Rate',
      detail: `This component already has a rate for the same place and jurisdiction check valid from ${clash.validFrom} ${clash.validTo ? `to ${clash.validTo}` : 'with no end date'}. End that rate first, or choose dates outside it.`,
      errors: [{ field: 'validFrom', message: 'Overlaps another rate' }],
    });
  }

  // Deletes in one statement; nothing deleted means the rate is not on this group
  async deleteOrThrow(taxGroupId: string, id: string): Promise<void> {
    const { count } = await this.deleteMany(
      and(eq(taxGroupRates.id, id), eq(taxGroupRates.taxGroupId, taxGroupId)) as SQL,
    );
    if (count === 0) throw new NotFoundException('Tax rate not found.');
  }

  // Matches rates in force on the day: started by then and not yet ended
  private validOn(rates: { validFrom: AnyPgColumn; validTo: AnyPgColumn }, day: string): SQL | undefined {
    return and(lte(rates.validFrom, day), or(isNull(rates.validTo), gte(rates.validTo, day)));
  }

  // Matches the rates charged in a jurisdiction: its own rows, and the whole-country rows of every component and
  // jurisdiction check it has none for — per component, together with the components that stand in for it, the more
  // specific jurisdiction wins, so a jurisdiction's UTGST row replaces the whole-country SGST row
  private appliesIn(jurisdictionId: string, asOf: string | undefined): SQL | undefined {
    const stateRates = alias(taxGroupRates, 'state_rates');
    const stateComponents = alias(taxComponents, 'state_components');
    return or(
      eq(taxGroupRates.jurisdictionId, jurisdictionId),
      and(
        isNull(taxGroupRates.jurisdictionId),
        notExists(
          this.db
            .select({ one: sql`1` })
            .from(stateRates)
            .innerJoin(stateComponents, eq(stateComponents.id, stateRates.taxComponentId))
            .where(
              and(
                eq(stateRates.taxGroupId, taxGroupRates.taxGroupId),
                sql`coalesce(${stateComponents.standsInForId}, ${stateComponents.id}) = coalesce(${taxComponents.standsInForId}, ${taxComponents.id})`,
                sql`${stateRates.jurisdictionCheck} is not distinct from ${taxGroupRates.jurisdictionCheck}`,
                eq(stateRates.jurisdictionId, jurisdictionId),
                asOf ? this.validOn(stateRates, asOf) : undefined,
              ),
            ),
        ),
      ),
    );
  }

  // Matches rates of the same group, component, place and jurisdiction check — none counts as one value of each
  private sameSlot(slot: TaxGroupRateSlot): SQL | undefined {
    return and(
      eq(taxGroupRates.taxGroupId, slot.taxGroupId),
      eq(taxGroupRates.taxComponentId, slot.taxComponentId),
      slot.jurisdictionId
        ? eq(taxGroupRates.jurisdictionId, slot.jurisdictionId)
        : isNull(taxGroupRates.jurisdictionId),
      slot.jurisdictionCheck
        ? eq(taxGroupRates.jurisdictionCheck, slot.jurisdictionCheck)
        : isNull(taxGroupRates.jurisdictionCheck),
    );
  }

  // Selects a rate with its component's code and name and its jurisdiction's name — null for a whole-country rate
  private selection() {
    return {
      ...getColumns(taxGroupRates),
      taxComponentCode: taxComponents.code,
      taxComponentName: taxComponents.name,
      jurisdictionName: taxJurisdictions.name,
    };
  }

  // Joins the component every rate names
  private innerJoins() {
    return [{ table: taxComponents, on: eq(taxComponents.id, taxGroupRates.taxComponentId) }];
  }

  // Joins the jurisdiction, which a whole-country rate does not name
  private leftJoins() {
    return [{ table: taxJurisdictions, on: eq(taxJurisdictions.id, taxGroupRates.jurisdictionId) }];
  }
}
