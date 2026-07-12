import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { desc, eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  catalogs,
  categories,
  inventoryItems,
  type Offering,
  type OfferingVariant,
  type OfferingVariantOptionValue,
  offeringModifierGroups,
  offeringOptions,
  offerings,
  offeringVariantComponents,
  offeringVariantOptionValues,
  offeringVariants,
  type VariantOption,
  type VariantOptionValue,
  variantOptions,
  variantOptionValues,
} from '@/db/schema';

export type VariantComponentRow = {
  offeringVariantId: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  quantity: number;
};

export type OfferingRow = Offering & { categoryName: string | null; currencyCode: string };

export type OfferingAxis = VariantOption & { axisSortOrder: number };

@Injectable()
export class OfferingsRepository extends PrimaryBaseRepository<typeof offerings> {
  constructor(database: PrimaryDatabaseService) {
    super(database, offerings);
  }

  // Returns all offerings for a site with category name joined
  async findByBuWithCategory(siteId: string): Promise<(Offering & { categoryName: string | null })[]> {
    return this.db
      .select({
        id: offerings.id,
        organizationId: offerings.organizationId,
        siteId: offerings.siteId,
        catalogId: offerings.catalogId,
        categoryId: offerings.categoryId,
        fulfilmentType: offerings.fulfilmentType,
        name: offerings.name,
        description: offerings.description,
        salesTaxGroupId: offerings.salesTaxGroupId,
        isAvailable: offerings.isAvailable,
        sortOrder: offerings.sortOrder,
        attributes: offerings.attributes,
        metadata: offerings.metadata,
        createdAt: offerings.createdAt,
        updatedAt: offerings.updatedAt,
        categoryName: categories.name,
      })
      .from(offerings)
      .leftJoin(categories, eq(offerings.categoryId, categories.id))
      .where(eq(offerings.siteId, siteId))
      .orderBy(offerings.sortOrder);
  }

  // Returns paginated offerings with category name and catalog currency for table display
  async findForTable(params: {
    where: SQL | undefined;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: OfferingRow[]; count: number }> {
    return this.findAllAndCount<OfferingRow>({
      select: {
        id: offerings.id,
        organizationId: offerings.organizationId,
        siteId: offerings.siteId,
        catalogId: offerings.catalogId,
        categoryId: offerings.categoryId,
        fulfilmentType: offerings.fulfilmentType,
        name: offerings.name,
        description: offerings.description,
        salesTaxGroupId: offerings.salesTaxGroupId,
        isAvailable: offerings.isAvailable,
        sortOrder: offerings.sortOrder,
        attributes: offerings.attributes,
        metadata: offerings.metadata,
        createdAt: offerings.createdAt,
        updatedAt: offerings.updatedAt,
        categoryName: categories.name,
        currencyCode: catalogs.currencyCode,
      },
      leftJoins: [
        { table: categories, on: eq(offerings.categoryId, categories.id) },
        { table: catalogs, on: eq(offerings.catalogId, catalogs.id) },
      ],
      where: params.where,
      orderBy: params.orderBy.length > 0 ? params.orderBy : [desc(offerings.createdAt)],
      limit: params.limit,
      offset: params.offset,
    });
  }

  // Returns a map of offeringId -> attached modifier group count
  async findModifierGroupCountsByOfferingIds(offeringIds: string[]): Promise<Map<string, number>> {
    if (offeringIds.length === 0) return new Map();
    const rows = await this.db
      .select({
        offeringId: offeringModifierGroups.offeringId,
        count: sql<number>`count(*)`,
      })
      .from(offeringModifierGroups)
      .where(inArray(offeringModifierGroups.offeringId, offeringIds))
      .groupBy(offeringModifierGroups.offeringId);
    return new Map(rows.map((row) => [row.offeringId, Number(row.count)]));
  }

  // Returns the catalog's currency code for a given catalog ID
  async findCatalogCurrency(catalogId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ currencyCode: catalogs.currencyCode })
      .from(catalogs)
      .where(eq(catalogs.id, catalogId));
    return row?.currencyCode ?? null;
  }

  // Returns the offering's axes (variant options) ordered by the junction sortOrder
  async findAxesByOfferingId(offeringId: string): Promise<OfferingAxis[]> {
    return this.db
      .select({
        id: variantOptions.id,
        organizationId: variantOptions.organizationId,
        catalogId: variantOptions.catalogId,
        name: variantOptions.name,
        sortOrder: variantOptions.sortOrder,
        createdAt: variantOptions.createdAt,
        updatedAt: variantOptions.updatedAt,
        axisSortOrder: offeringOptions.sortOrder,
      })
      .from(offeringOptions)
      .innerJoin(variantOptions, eq(offeringOptions.variantOptionId, variantOptions.id))
      .where(eq(offeringOptions.offeringId, offeringId))
      .orderBy(offeringOptions.sortOrder);
  }

  // Returns values for the given variant option IDs ordered by sortOrder
  async findValuesByOptionIds(optionIds: string[]): Promise<VariantOptionValue[]> {
    if (optionIds.length === 0) return [];
    return this.db
      .select()
      .from(variantOptionValues)
      .where(inArray(variantOptionValues.variantOptionId, optionIds))
      .orderBy(variantOptionValues.sortOrder);
  }

  // Returns the variant options matching the given IDs (for catalog validation)
  async findVariantOptionsByIds(optionIds: string[]): Promise<VariantOption[]> {
    if (optionIds.length === 0) return [];
    return this.db.select().from(variantOptions).where(inArray(variantOptions.id, optionIds));
  }

  // Replaces an offering's axes with the given variant options in array order
  async setAxes(offeringId: string, variantOptionIds: string[]): Promise<void> {
    await this.db.delete(offeringOptions).where(eq(offeringOptions.offeringId, offeringId));
    if (variantOptionIds.length === 0) return;
    await this.db
      .insert(offeringOptions)
      .values(variantOptionIds.map((variantOptionId, index) => ({ offeringId, variantOptionId, sortOrder: index })));
  }

  // Returns the number of variants for an offering
  async countVariantsByOfferingId(offeringId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(offeringVariants)
      .where(eq(offeringVariants.offeringId, offeringId));
    return Number(row?.count ?? 0);
  }

  // Returns variants for an offering ordered by sortOrder
  async findVariantsByOfferingId(offeringId: string): Promise<OfferingVariant[]> {
    return this.db
      .select()
      .from(offeringVariants)
      .where(eq(offeringVariants.offeringId, offeringId))
      .orderBy(offeringVariants.sortOrder);
  }

  // Returns variant-option-value links for given variant IDs
  async findVariantOptionValues(variantIds: string[]): Promise<OfferingVariantOptionValue[]> {
    if (variantIds.length === 0) return [];
    return this.db
      .select()
      .from(offeringVariantOptionValues)
      .where(inArray(offeringVariantOptionValues.offeringVariantId, variantIds));
  }

  // Deletes all variants and their option-value links for an offering
  async deleteVariantsByOfferingId(offeringId: string): Promise<void> {
    const variants = await this.findVariantsByOfferingId(offeringId);
    const variantIds = variants.map((v) => v.id);
    if (variantIds.length > 0) {
      await this.db
        .delete(offeringVariantOptionValues)
        .where(inArray(offeringVariantOptionValues.offeringVariantId, variantIds));
    }
    await this.db.delete(offeringVariants).where(eq(offeringVariants.offeringId, offeringId));
  }

  // Deletes an offering's axes
  async deleteAxesByOfferingId(offeringId: string): Promise<void> {
    await this.db.delete(offeringOptions).where(eq(offeringOptions.offeringId, offeringId));
  }

  // Creates a variant row for an offering
  async createVariant(data: {
    offeringId: string;
    sku: string;
    name: string;
    price: bigint;
    sortOrder: number;
    isAvailable?: boolean;
  }): Promise<OfferingVariant> {
    const [row] = await this.db.insert(offeringVariants).values(data).returning();
    return row;
  }

  // Replaces a variant's components, deleting existing rows then bulk inserting
  async replaceComponents(
    variantId: string,
    components: { inventoryItemId: string; quantity: number }[],
  ): Promise<void> {
    await this.db.delete(offeringVariantComponents).where(eq(offeringVariantComponents.offeringVariantId, variantId));
    if (components.length === 0) return;
    await this.db.insert(offeringVariantComponents).values(
      components.map((c) => ({
        offeringVariantId: variantId,
        inventoryItemId: c.inventoryItemId,
        quantity: c.quantity,
      })),
    );
  }

  // Returns component rows for the given variant IDs with the inventory item name joined
  async findComponentsByVariantIds(variantIds: string[]): Promise<VariantComponentRow[]> {
    if (variantIds.length === 0) return [];
    return this.db
      .select({
        offeringVariantId: offeringVariantComponents.offeringVariantId,
        inventoryItemId: offeringVariantComponents.inventoryItemId,
        inventoryItemName: inventoryItems.name,
        quantity: offeringVariantComponents.quantity,
      })
      .from(offeringVariantComponents)
      .leftJoin(inventoryItems, eq(offeringVariantComponents.inventoryItemId, inventoryItems.id))
      .where(inArray(offeringVariantComponents.offeringVariantId, variantIds));
  }

  // Creates variant-option-value link rows
  async createVariantOptionValues(data: { offeringVariantId: string; variantOptionValueId: string }[]): Promise<void> {
    if (data.length === 0) return;
    await this.db.insert(offeringVariantOptionValues).values(data);
  }

  // Finds a single variant by ID
  async findVariantById(variantId: string): Promise<OfferingVariant | undefined> {
    const [row] = await this.db.select().from(offeringVariants).where(eq(offeringVariants.id, variantId));
    return row;
  }

  // Updates a variant by ID and returns the updated row
  async updateVariant(variantId: string, data: Partial<OfferingVariant>): Promise<OfferingVariant> {
    const [row] = await this.db
      .update(offeringVariants)
      .set(data)
      .where(eq(offeringVariants.id, variantId))
      .returning();
    return row;
  }

  // Returns the category name for a given category ID
  async findCategoryName(categoryId: string | null): Promise<string | null> {
    if (!categoryId) return null;
    const [row] = await this.db.select({ name: categories.name }).from(categories).where(eq(categories.id, categoryId));
    return row?.name ?? null;
  }

  // Returns the human-readable breadcrumb path for a given category ID
  async findCategoryPath(categoryId: string | null): Promise<string | null> {
    if (!categoryId) return null;
    const [row] = await this.db
      .select({ pathBreadcrumb: categories.pathBreadcrumb })
      .from(categories)
      .where(eq(categories.id, categoryId));
    return row?.pathBreadcrumb ?? null;
  }

  // Deletes a variant and its option-value links
  async deleteVariant(variantId: string): Promise<void> {
    await this.db
      .delete(offeringVariantOptionValues)
      .where(eq(offeringVariantOptionValues.offeringVariantId, variantId));
    await this.db.delete(offeringVariants).where(eq(offeringVariants.id, variantId));
  }
}
