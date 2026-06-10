import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import { type TaxGroup, type TaxRate, taxGroups, taxRates } from '@/db/schema';

@Injectable()
export class TaxGroupsRepository extends PrimaryBaseRepository<typeof taxGroups> {
  constructor(database: PrimaryDatabaseService) {
    super(database, taxGroups);
  }

  // Returns all tax groups with their associated tax rates (RLS scopes to org + BU)
  async findAllWithRates(): Promise<(TaxGroup & { taxRates: TaxRate[] })[]> {
    const groups = await this.model.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const result: (TaxGroup & { taxRates: TaxRate[] })[] = [];
    for (const group of groups) {
      const rates = await this.findTaxRatesByGroupId(group.id);
      result.push({ ...group, taxRates: rates });
    }
    return result;
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
