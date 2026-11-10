import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, getColumns, gte, isNull, lte, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type FindForSelectConfig, type SelectQueryResult } from '@vritti/api-sdk/select';
import { type TaxClass, taxClasses, taxClassGroups, taxGroups } from '@/db/schema';

export interface TaxClassTaxGroupRow {
  taxGroupId: string;
  taxGroupCode: string;
  taxGroupName: string;
  maxUnitPrice: string | null;
  currencyCode: string | null;
}

export type TaxClassTableRow = TaxClass & { taxGroups: TaxClassTaxGroupRow[] };

@Injectable()
export class TaxClassesDomainRepository extends PrimaryBaseRepository<typeof taxClasses> {
  constructor(database: PrimaryDatabaseService) {
    super(database, taxClasses);
  }

  // Paginated tax-class options for the selector dropdown
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Lookup by `code` within an org for exact-string matching
  async findByCode(code: string): Promise<TaxClass | undefined> {
    const [row] = await this.db.select().from(taxClasses).where(eq(taxClasses.code, code)).limit(1);
    return row as TaxClass | undefined;
  }

  // Returns paginated tax classes, each with the tax groups it is mapped to in a country on a day, filtered by an
  // already-built where clause; without both every class has no groups
  findForTable(options: {
    countryCode: string | undefined;
    asOf: string | undefined;
    where?: SQL;
    orderBy?: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: TaxClassTableRow[]; count: number }> {
    const { countryCode, asOf, ...page } = options;
    const groupsInForce = this.taxGroupsInForce(countryCode, asOf);
    return this.findAllAndCount<TaxClassTableRow>({
      select: { ...getColumns(taxClasses), taxGroups: groupsInForce.taxGroups },
      leftJoins: [{ table: groupsInForce, on: undefined, lateral: true }],
      ...page,
    });
  }

  // The class's mappings valid on the day in the country with their groups, as one JSON array per class — price limits
  // ascending, no limit last; the price limit travels as text so a bigint survives JSON
  private taxGroupsInForce(countryCode: string | undefined, asOf: string | undefined) {
    return this.db
      .select({
        taxGroups: sql<TaxClassTaxGroupRow[]>`coalesce(json_agg(json_build_object(
          'taxGroupId', ${taxGroups.id},
          'taxGroupCode', ${taxGroups.code},
          'taxGroupName', ${taxGroups.name},
          'maxUnitPrice', ${taxClassGroups.maxUnitPrice}::text,
          'currencyCode', ${taxClassGroups.currencyCode}
        ) order by ${taxClassGroups.maxUnitPrice} asc nulls last, ${taxGroups.name}), '[]'::json)`.as('tax_groups'),
      })
      .from(taxClassGroups)
      .innerJoin(taxGroups, eq(taxGroups.id, taxClassGroups.taxGroupId))
      .where(
        countryCode && asOf
          ? and(
              eq(taxClassGroups.taxClassId, taxClasses.id),
              eq(taxClassGroups.countryCode, countryCode),
              lte(taxClassGroups.validFrom, asOf),
              or(isNull(taxClassGroups.validTo), gte(taxClassGroups.validTo, asOf)),
            )
          : sql`false`,
      )
      .as('class_tax_groups');
  }
}
