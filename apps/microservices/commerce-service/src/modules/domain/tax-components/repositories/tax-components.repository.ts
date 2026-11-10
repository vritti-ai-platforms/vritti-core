import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, count, eq, getColumns, gte, isNull, ne, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { alias } from '@vritti/api-sdk/drizzle-pg-core';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type FindForSelectConfig, type SelectQueryResult } from '@vritti/api-sdk/select';
import { type TaxComponent, taxComponents, taxGroupRates } from '@/db/schema';

export type TaxComponentDetail = TaxComponent & {
  rateCount: number;
  openRateCount: number;
  standInCount: number;
  standsInForName: string | null;
};

const standsInFor = alias(taxComponents, 'stands_in_for');
const standIns = alias(taxComponents, 'stand_ins');

@Injectable()
export class TaxComponentsDomainRepository extends PrimaryBaseRepository<typeof taxComponents> {
  constructor(database: PrimaryDatabaseService) {
    super(database, taxComponents);
  }

  // Paginated tax-component options for the selector dropdown
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Loads a tax component with how many tax-group rates use it
  async findDetailOrThrow(id: string): Promise<TaxComponentDetail> {
    const entity = await this.findById<TaxComponentDetail>(id, {
      select: this.selection(),
      leftJoins: this.leftJoins(),
    });
    if (!entity) throw new NotFoundException('Tax component not found.');
    return entity;
  }

  // Returns paginated tax components with their rate counts, filtered by an already-built where clause
  findDetailsForTable(options: {
    where?: SQL;
    orderBy?: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: TaxComponentDetail[]; count: number }> {
    return this.findAllAndCount<TaxComponentDetail>({
      select: this.selection(),
      leftJoins: this.leftJoins(),
      ...options,
    });
  }

  // Codes are unique per organization and country
  async assertCodeFree(countryCode: string, code: string, excludeId?: string): Promise<void> {
    const taken = await this.exists(
      and(
        eq(taxComponents.countryCode, countryCode),
        eq(taxComponents.code, code),
        excludeId ? ne(taxComponents.id, excludeId) : undefined,
      ) as SQL,
    );
    if (!taken) return;
    throw new ConflictException({
      label: 'Code Already Used',
      detail: `A ${countryCode} tax component with code "${code}" already exists.`,
      errors: [{ field: 'code', message: 'Code already in use' }],
    });
  }

  // Tax-group rates take their component from the group's country, so a component's country is fixed once a rate
  // uses it
  assertCountryChangeable(existing: TaxComponentDetail, countryCode: string): void {
    if (countryCode === existing.countryCode || existing.rateCount === 0) return;
    throw new ConflictException({
      label: 'Tax Component In Use',
      detail: `Tax-group rates in ${existing.countryCode} use "${existing.name}", so its country cannot change.`,
      errors: [{ field: 'countryCode', message: 'Used by tax-group rates' }],
    });
  }

  // A component stands in for another of its own country — never itself, never one that stands in for a third, and
  // not while other components stand in for it — so a stand-in always replaces a component that is charged directly
  async assertStandInValid(
    component: { id?: string; countryCode: string; standInCount: number },
    standsInForId: string,
  ): Promise<void> {
    const [target] = await this.db.select().from(taxComponents).where(eq(taxComponents.id, standsInForId)).limit(1);
    const reason = !target
      ? 'The selected tax component no longer exists.'
      : target.id === component.id
        ? 'A tax component cannot stand in for itself.'
        : target.countryCode !== component.countryCode
          ? `"${target.name}" is a ${target.countryCode} tax component; pick one of ${component.countryCode}.`
          : target.standsInForId !== null
            ? `"${target.name}" itself stands in for another component; pick that component instead.`
            : component.standInCount > 0
              ? 'Other components stand in for this one, so it cannot stand in for another.'
              : null;
    if (!reason) return;
    throw new BadRequestException({
      label: 'Invalid Stand-In',
      detail: reason,
      errors: [{ field: 'standsInForId', message: reason }],
    });
  }

  // Components that stand in for this one take its country, so its country is fixed while they exist
  assertNoStandInsForCountryChange(existing: TaxComponentDetail, countryCode: string): void {
    if (countryCode === existing.countryCode || existing.standInCount === 0) return;
    throw new ConflictException({
      label: 'Tax Component In Use',
      detail: `Other ${existing.countryCode} components stand in for "${existing.name}", so its country cannot change.`,
      errors: [{ field: 'countryCode', message: 'Other components stand in for it' }],
    });
  }

  // A tax group charging the component today or later would charge an inactive tax, so it stays active while a rate in
  // force or still to come uses it
  assertDeactivatable(existing: TaxComponentDetail): void {
    if (existing.openRateCount === 0) return;
    throw new ConflictException({
      label: 'Tax Component In Use',
      detail: `Cannot deactivate "${existing.name}" — tax-group rates in force or still to come use it. End those rates first.`,
    });
  }

  // System components are reserved, and a component that tax-group rates use or others stand in for cannot be deleted
  assertDeletable(existing: TaxComponentDetail): void {
    if (existing.isSystem) {
      throw new ConflictException({
        label: 'System Tax Component',
        detail: `Cannot delete "${existing.name}" — it is reserved by the system.`,
      });
    }
    if (existing.rateCount > 0) {
      throw new ConflictException({
        label: 'Tax Component In Use',
        detail: `Cannot delete "${existing.name}" — tax-group rates use it. Remove those rates first.`,
      });
    }
    if (existing.standInCount > 0) {
      throw new ConflictException({
        label: 'Tax Component In Use',
        detail: `Cannot delete "${existing.name}" — other components stand in for it. Change those first.`,
      });
    }
  }

  // Selects a tax component with how many tax-group rates use it (in all, and in force or still to come), how many
  // components stand in for it and the name of the one it stands in for
  private selection() {
    return {
      ...getColumns(taxComponents),
      rateCount: this.db.$count(taxGroupRates, eq(taxGroupRates.taxComponentId, taxComponents.id)),
      openRateCount: this.db.$count(
        taxGroupRates,
        and(
          eq(taxGroupRates.taxComponentId, taxComponents.id),
          or(isNull(taxGroupRates.validTo), gte(taxGroupRates.validTo, sql`current_date`)),
        ),
      ),
      standInCount: sql<number>`(${this.db
        .select({ count: count() })
        .from(standIns)
        .where(eq(standIns.standsInForId, taxComponents.id))})`.mapWith(Number),
      standsInForName: standsInFor.name,
    };
  }

  // Joins the component a component stands in for, when it has one
  private leftJoins() {
    return [{ table: standsInFor, on: eq(standsInFor.id, taxComponents.standsInForId) }];
  }
}
