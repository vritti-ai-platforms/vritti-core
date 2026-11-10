import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, getColumns, gte, isNull, ne, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type FindForSelectConfig, type SelectQueryResult } from '@vritti/api-sdk/select';
import { type TaxGroup, taxClassGroups, taxGroupRates, taxGroups } from '@/db/schema';

export type TaxGroupDetail = TaxGroup & {
  rateCount: number;
  classCount: number;
  openClassCount: number;
};

@Injectable()
export class TaxGroupsDomainRepository extends PrimaryBaseRepository<typeof taxGroups> {
  constructor(database: PrimaryDatabaseService) {
    super(database, taxGroups);
  }

  // Returns paginated tax-group options for the selector dropdown
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Loads a tax group, throwing when it is out of reach
  async findByIdOrThrow(id: string): Promise<TaxGroup> {
    const entity = await this.findById(id);
    if (!entity) throw new NotFoundException('Tax group not found.');
    return entity;
  }

  // Loads a tax group with how many rates and class mappings it has
  async findDetailOrThrow(id: string): Promise<TaxGroupDetail> {
    const entity = await this.findById<TaxGroupDetail>(id, { select: this.selection() });
    if (!entity) throw new NotFoundException('Tax group not found.');
    return entity;
  }

  // Returns paginated tax groups with their rate and class counts, filtered by an already-built where clause
  findDetailsForTable(options: {
    where?: SQL;
    orderBy?: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: TaxGroupDetail[]; count: number }> {
    return this.findAllAndCount<TaxGroupDetail>({ select: this.selection(), ...options });
  }

  // Codes are unique per organization and country
  async assertCodeFree(countryCode: string, code: string, excludeId?: string): Promise<void> {
    const taken = await this.exists(
      and(
        eq(taxGroups.countryCode, countryCode),
        eq(taxGroups.code, code),
        excludeId ? ne(taxGroups.id, excludeId) : undefined,
      ) as SQL,
    );
    if (!taken) return;
    throw new ConflictException({
      label: 'Code Already Used',
      detail: `A ${countryCode} tax group with code "${code}" already exists.`,
      errors: [{ field: 'code', message: 'Code already in use' }],
    });
  }

  // Tax classes mapped to a group are taxed through it, so the group stays until every mapping moves elsewhere
  assertDeletable(group: TaxGroupDetail): void {
    if (group.classCount === 0) return;
    throw new ConflictException({
      label: 'Tax Group In Use',
      detail: `Cannot delete "${group.name}" — tax classes are mapped to it. Map them to another group first.`,
    });
  }

  // A class mapped to the group today or later would be taxed by an inactive group, so the group stays active while a
  // mapping in force or still to come names it
  assertDeactivatable(group: TaxGroupDetail): void {
    if (group.openClassCount === 0) return;
    throw new ConflictException({
      label: 'Tax Group In Use',
      detail: `Cannot deactivate "${group.name}" — tax classes are mapped to it today or from a later day. End those mappings first.`,
    });
  }

  // Selects a tax group with how many rates and class mappings it has, and how many mappings are in force or still to
  // come
  private selection() {
    return {
      ...getColumns(taxGroups),
      rateCount: this.db.$count(taxGroupRates, eq(taxGroupRates.taxGroupId, taxGroups.id)),
      classCount: this.db.$count(taxClassGroups, eq(taxClassGroups.taxGroupId, taxGroups.id)),
      openClassCount: this.db.$count(
        taxClassGroups,
        and(
          eq(taxClassGroups.taxGroupId, taxGroups.id),
          or(isNull(taxClassGroups.validTo), gte(taxClassGroups.validTo, sql`current_date`)),
        ),
      ),
    };
  }
}
