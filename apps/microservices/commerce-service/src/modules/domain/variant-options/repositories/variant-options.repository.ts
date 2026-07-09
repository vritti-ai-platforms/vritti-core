import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { eq, inArray, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  offeringOptions,
  offeringVariantOptionValues,
  type VariantOption,
  type VariantOptionValue,
  variantOptions,
  variantOptionValues,
} from '@/db/schema';

@Injectable()
export class VariantOptionsRepository extends PrimaryBaseRepository<typeof variantOptions> {
  constructor(database: PrimaryDatabaseService) {
    super(database, variantOptions);
  }

  // Returns variant options for a catalog ordered by sortOrder (RLS scopes to org + BU)
  async findByCatalogId(catalogId: string): Promise<VariantOption[]> {
    return this.model.findMany({
      where: { catalogId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Returns paginated variant option select results scoped to a catalog
  findForSelectByCatalog(catalogId: string, config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect({ ...config, where: { ...config.where, catalogId } });
  }

  // Finds a single variant option by ID
  async findOptionById(optionId: string): Promise<VariantOption | undefined> {
    const [row] = await this.db.select().from(variantOptions).where(eq(variantOptions.id, optionId));
    return row;
  }

  // Returns the highest sortOrder for a catalog's options, or -1 when none exist
  async findMaxSortOrder(catalogId: string): Promise<number> {
    const [row] = await this.db
      .select({ max: sql<number | null>`max(${variantOptions.sortOrder})` })
      .from(variantOptions)
      .where(eq(variantOptions.catalogId, catalogId));
    return row?.max ?? -1;
  }

  // Creates a variant option row
  async createOption(data: { catalogId: string; name: string; sortOrder: number }): Promise<VariantOption> {
    const [row] = await this.db.insert(variantOptions).values(data).returning();
    return row;
  }

  // Updates a variant option's name
  async updateOption(optionId: string, data: { name: string }): Promise<VariantOption> {
    const [row] = await this.db.update(variantOptions).set(data).where(eq(variantOptions.id, optionId)).returning();
    return row;
  }

  // Deletes a variant option row
  async deleteOption(optionId: string): Promise<void> {
    await this.db.delete(variantOptions).where(eq(variantOptions.id, optionId));
  }

  // Returns values for a variant option ordered by sortOrder
  async findValuesByOptionId(optionId: string): Promise<VariantOptionValue[]> {
    return this.db
      .select()
      .from(variantOptionValues)
      .where(eq(variantOptionValues.variantOptionId, optionId))
      .orderBy(variantOptionValues.sortOrder);
  }

  // Creates a variant option value row
  async createValue(data: { variantOptionId: string; value: string; sortOrder: number }): Promise<VariantOptionValue> {
    const [row] = await this.db.insert(variantOptionValues).values(data).returning();
    return row;
  }

  // Deletes specific variant option value rows by ID
  async deleteValues(valueIds: string[]): Promise<void> {
    if (valueIds.length === 0) return;
    await this.db.delete(variantOptionValues).where(inArray(variantOptionValues.id, valueIds));
  }

  // Returns the subset of the given value IDs that are referenced by any variant
  async findReferencedValueIds(valueIds: string[]): Promise<string[]> {
    if (valueIds.length === 0) return [];
    const rows = await this.db
      .selectDistinct({ id: offeringVariantOptionValues.variantOptionValueId })
      .from(offeringVariantOptionValues)
      .where(inArray(offeringVariantOptionValues.variantOptionValueId, valueIds));
    return rows.map((row) => row.id);
  }

  // Returns the count of variant rows referencing any of the given option value IDs
  async countVariantReferencesForValues(valueIds: string[]): Promise<number> {
    if (valueIds.length === 0) return 0;
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(offeringVariantOptionValues)
      .where(inArray(offeringVariantOptionValues.variantOptionValueId, valueIds));
    return Number(row?.count ?? 0);
  }

  // Returns the count of offering axes referencing a variant option
  async countAxisReferencesForOption(optionId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(offeringOptions)
      .where(eq(offeringOptions.variantOptionId, optionId));
    return Number(row?.count ?? 0);
  }
}
