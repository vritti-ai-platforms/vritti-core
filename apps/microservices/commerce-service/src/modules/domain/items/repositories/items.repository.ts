import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { desc, eq, inArray, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  categories,
  type Item,
  type ItemOption,
  type ItemOptionValue,
  type ItemVariant,
  type ItemVariantOptionValue,
  itemCodeSeq,
  itemOptions,
  itemOptionValues,
  items,
  itemVariantOptionValues,
  itemVariants,
} from '@/db/schema';

@Injectable()
export class ItemsRepository extends PrimaryBaseRepository<typeof items> {
  constructor(database: PrimaryDatabaseService) {
    super(database, items, { sequence: itemCodeSeq });
  }

  // Returns all items for a business unit with category name joined
  async findByBuWithCategory(buId: string): Promise<(Item & { categoryName: string | null })[]> {
    return this.db
      .select({
        id: items.id,
        organizationId: items.organizationId,
        businessUnitId: items.businessUnitId,
        categoryId: items.categoryId,
        type: items.type,
        code: items.code,
        name: items.name,
        description: items.description,
        taxGroupId: items.taxGroupId,
        isAvailable: items.isAvailable,
        sortOrder: items.sortOrder,
        attributes: items.attributes,
        metadata: items.metadata,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
        categoryName: categories.name,
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(eq(items.businessUnitId, buId))
      .orderBy(items.sortOrder);
  }

  // Returns paginated items with category name for table display
  async findForTable(params: {
    where: SQL | undefined;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: (Item & { categoryName: string | null })[]; count: number }> {
    return this.findAllAndCount<Item & { categoryName: string | null }>({
      select: {
        id: items.id,
        organizationId: items.organizationId,
        businessUnitId: items.businessUnitId,
        categoryId: items.categoryId,
        type: items.type,
        code: items.code,
        name: items.name,
        description: items.description,
        taxGroupId: items.taxGroupId,
        isAvailable: items.isAvailable,
        sortOrder: items.sortOrder,
        attributes: items.attributes,
        metadata: items.metadata,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
        categoryName: categories.name,
      },
      leftJoins: [{ table: categories, on: eq(items.categoryId, categories.id) }],
      where: params.where,
      orderBy: params.orderBy.length > 0 ? params.orderBy : [desc(items.createdAt)],
      limit: params.limit,
      offset: params.offset,
    });
  }

  // Returns options for an item ordered by sortOrder
  async findOptionsByItemId(itemId: string): Promise<ItemOption[]> {
    return this.db.select().from(itemOptions).where(eq(itemOptions.itemId, itemId)).orderBy(itemOptions.sortOrder);
  }

  // Returns option values for a given option ID
  async findOptionValuesByOptionId(optionId: string): Promise<ItemOptionValue[]> {
    return this.db
      .select()
      .from(itemOptionValues)
      .where(eq(itemOptionValues.optionId, optionId))
      .orderBy(itemOptionValues.sortOrder);
  }

  // Returns all option values for an item (across all its options)
  async findAllOptionValuesByItemId(itemId: string): Promise<ItemOptionValue[]> {
    return this.db
      .select({
        id: itemOptionValues.id,
        organizationId: itemOptionValues.organizationId,
        optionId: itemOptionValues.optionId,
        value: itemOptionValues.value,
        sortOrder: itemOptionValues.sortOrder,
      })
      .from(itemOptionValues)
      .innerJoin(itemOptions, eq(itemOptionValues.optionId, itemOptions.id))
      .where(eq(itemOptions.itemId, itemId))
      .orderBy(itemOptions.sortOrder, itemOptionValues.sortOrder);
  }

  // Returns variants for an item ordered by sortOrder
  async findVariantsByItemId(itemId: string): Promise<ItemVariant[]> {
    return this.db.select().from(itemVariants).where(eq(itemVariants.itemId, itemId)).orderBy(itemVariants.sortOrder);
  }

  // Returns variant-option-value links for given variant IDs
  async findVariantOptionValues(variantIds: string[]): Promise<ItemVariantOptionValue[]> {
    if (variantIds.length === 0) return [];
    return this.db.select().from(itemVariantOptionValues).where(inArray(itemVariantOptionValues.variantId, variantIds));
  }

  // Deletes all options (and cascading values) for an item
  async deleteOptionsByItemId(itemId: string): Promise<void> {
    const opts = await this.findOptionsByItemId(itemId);
    for (const opt of opts) {
      await this.db.delete(itemOptionValues).where(eq(itemOptionValues.optionId, opt.id));
    }
    await this.db.delete(itemOptions).where(eq(itemOptions.itemId, itemId));
  }

  // Creates an option row for an item
  async createOption(data: { itemId: string; name: string; sortOrder: number }): Promise<ItemOption> {
    const results = await this.db.insert(itemOptions).values(data).returning();
    return results[0];
  }

  // Creates an option value row
  async createOptionValue(data: { optionId: string; value: string; sortOrder: number }): Promise<ItemOptionValue> {
    const results = await this.db.insert(itemOptionValues).values(data).returning();
    return results[0];
  }

  // Deletes all variants and their option-value links for an item
  async deleteVariantsByItemId(itemId: string): Promise<void> {
    const variants = await this.findVariantsByItemId(itemId);
    const variantIds = variants.map((v) => v.id);
    if (variantIds.length > 0) {
      await this.db.delete(itemVariantOptionValues).where(inArray(itemVariantOptionValues.variantId, variantIds));
    }
    await this.db.delete(itemVariants).where(eq(itemVariants.itemId, itemId));
  }

  // Creates a variant row for an item
  async createVariant(data: {
    itemId: string;
    sku: string;
    name: string;
    price: string;
    sortOrder: number;
  }): Promise<ItemVariant> {
    const results = await this.db.insert(itemVariants).values(data).returning();
    return results[0];
  }

  // Creates variant-option-value link rows
  async createVariantOptionValues(data: { variantId: string; optionValueId: string }[]): Promise<void> {
    if (data.length === 0) return;
    await this.db.insert(itemVariantOptionValues).values(data);
  }

  // Finds a single variant by ID
  async findVariantById(variantId: string): Promise<ItemVariant | undefined> {
    const results = await this.db.select().from(itemVariants).where(eq(itemVariants.id, variantId));
    return results[0];
  }

  // Updates a variant by ID and returns the updated row
  async updateVariant(variantId: string, data: Partial<ItemVariant>): Promise<ItemVariant> {
    const results = await this.db.update(itemVariants).set(data).where(eq(itemVariants.id, variantId)).returning();
    return results[0];
  }

  // Returns the category name for a given category ID
  async findCategoryName(categoryId: string | null): Promise<string | null> {
    if (!categoryId) return null;
    const results = await this.db
      .select({ name: categories.name })
      .from(categories)
      .where(eq(categories.id, categoryId));
    return results[0]?.name ?? null;
  }

  // Deletes a variant and its option-value links
  async deleteVariant(variantId: string): Promise<void> {
    await this.db.delete(itemVariantOptionValues).where(eq(itemVariantOptionValues.variantId, variantId));
    await this.db.delete(itemVariants).where(eq(itemVariants.id, variantId));
  }

  // Generates a unique item code for a business unit
  // Generates a sequential item code (RLS scopes the count to current BU)
  async generateCode(): Promise<string> {
    const nextNumber = await this.nextSequenceValue();
    return `ITEM-${String(nextNumber).padStart(4, '0')}`;
  }
}
