import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq, inArray, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { type TaxGroup, type TaxRate, taxGroups, taxRates } from '@/db/schema';

@Injectable()
export class TaxGroupsDomainRepository extends PrimaryBaseRepository<typeof taxGroups> {
  constructor(database: PrimaryDatabaseService) {
    super(database, taxGroups);
  }

  // Returns a paginated page of tax groups + total count for the data table (RLS scopes to org + site)
  async findAllForTable(options: {
    where?: SQL;
    orderBy?: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: TaxGroup[]; count: number }> {
    return this.findAllAndCount<TaxGroup>(options);
  }

  // Returns tax rates for the given group ids in one query, keyed by group id (ordered by sortOrder)
  async findRatesByGroupIds(ids: string[]): Promise<Map<string, TaxRate[]>> {
    const byGroup = new Map<string, TaxRate[]>();
    if (ids.length === 0) return byGroup;
    const rows = (await this.db
      .select()
      .from(taxRates)
      .where(inArray(taxRates.taxGroupId, ids))
      .orderBy(taxRates.sortOrder)) as TaxRate[];
    for (const row of rows) {
      const list = byGroup.get(row.taxGroupId) ?? [];
      list.push(row);
      byGroup.set(row.taxGroupId, list);
    }
    return byGroup;
  }

  // Nothing references a tax group directly any more: products carry a tax CLASS, and a class is
  // mapped to a group per LE by tax_class_rates — which does not exist yet. Until it does, no group
  // is referenced, so none is protected from deletion.
  async findReferencedIds(_ids: string[]): Promise<Set<string>> {
    return new Set();
  }

  // Returns tax rates for a specific tax group
  async findTaxRatesByGroupId(groupId: string): Promise<TaxRate[]> {
    return this.db.select().from(taxRates).where(eq(taxRates.taxGroupId, groupId)).orderBy(taxRates.sortOrder);
  }

  // Creates multiple tax rates for a tax group
  async createTaxRates(
    groupId: string,
    rates: { name: string; rate: number; sortOrder: number }[],
  ): Promise<TaxRate[]> {
    if (rates.length === 0) return [];
    const values = rates.map((r) => ({ ...r, taxGroupId: groupId }));
    return this.db.insert(taxRates).values(values).returning() as Promise<TaxRate[]>;
  }

  // Deletes all tax rates for a given tax group
  async deleteTaxRatesByGroupId(groupId: string): Promise<void> {
    await this.db.delete(taxRates).where(eq(taxRates.taxGroupId, groupId));
  }
}
