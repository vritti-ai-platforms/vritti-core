import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { eq, inArray, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  type Catalog,
  catalogs,
  modifierGroups,
  modifierOptions,
  offeringModifierGroups,
  offeringOptions,
  offerings,
  offeringVariantComponents,
  offeringVariantOptionValues,
  offeringVariants,
  variantOptions,
  variantOptionValues,
} from '@/db/schema';

@Injectable()
export class CatalogsRepository extends PrimaryBaseRepository<typeof catalogs> {
  constructor(database: PrimaryDatabaseService) {
    super(database, catalogs);
  }

  // Paginated catalog options for the selector dropdown
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Returns paginated catalogs for table display
  async findForTable(params: {
    where: SQL | undefined;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: Catalog[]; count: number }> {
    return this.findAllAndCount<Catalog>({
      where: params.where,
      orderBy: params.orderBy,
      limit: params.limit,
      offset: params.offset,
    });
  }

  // Deep-copies a source catalog (offerings, options, variants, modifier groups, attachments)
  // onto a new catalog, remapping all foreign keys to the new ids. No channel assignments are copied.
  async cloneCatalog(source: Catalog): Promise<Catalog> {
    return this.db.transaction(async (tx) => {
      const [newCatalog] = (await tx
        .insert(catalogs)
        .values({
          businessUnitId: source.businessUnitId,
          name: source.name,
          currencyCode: source.currencyCode,
          taxInclusive: source.taxInclusive,
          isActive: source.isActive,
        })
        .returning()) as Catalog[];

      // Catalog variant options + values
      const variantOptionIdMap = new Map<string, string>();
      const variantOptionValueIdMap = new Map<string, string>();
      const sourceVariantOptions = await tx
        .select()
        .from(variantOptions)
        .where(eq(variantOptions.catalogId, source.id));
      for (const option of sourceVariantOptions) {
        const [row] = await tx
          .insert(variantOptions)
          .values({
            catalogId: newCatalog.id,
            name: option.name,
            sortOrder: option.sortOrder,
          })
          .returning();
        variantOptionIdMap.set(option.id, row.id);
      }

      const oldVariantOptionIds = sourceVariantOptions.map((o) => o.id);
      if (oldVariantOptionIds.length > 0) {
        const sourceVariantOptionValues = await tx
          .select()
          .from(variantOptionValues)
          .where(inArray(variantOptionValues.variantOptionId, oldVariantOptionIds));
        for (const value of sourceVariantOptionValues) {
          const [row] = await tx
            .insert(variantOptionValues)
            .values({
              variantOptionId: variantOptionIdMap.get(value.variantOptionId) as string,
              value: value.value,
              sortOrder: value.sortOrder,
            })
            .returning();
          variantOptionValueIdMap.set(value.id, row.id);
        }
      }

      // Offerings
      const offeringIdMap = new Map<string, string>();
      const sourceOfferings = await tx.select().from(offerings).where(eq(offerings.catalogId, source.id));
      for (const off of sourceOfferings) {
        const [row] = await tx
          .insert(offerings)
          .values({
            catalogId: newCatalog.id,
            categoryId: off.categoryId,
            fulfilmentType: off.fulfilmentType,
            name: off.name,
            description: off.description,
            salesTaxGroupId: off.salesTaxGroupId,
            isAvailable: off.isAvailable,
            sortOrder: off.sortOrder,
            attributes: off.attributes,
            metadata: off.metadata,
          })
          .returning();
        offeringIdMap.set(off.id, row.id);
      }

      const oldOfferingIds = sourceOfferings.map((o) => o.id);

      // Offering axes (offering -> variant option)
      if (oldOfferingIds.length > 0) {
        const sourceAxes = await tx
          .select()
          .from(offeringOptions)
          .where(inArray(offeringOptions.offeringId, oldOfferingIds));
        if (sourceAxes.length > 0) {
          await tx.insert(offeringOptions).values(
            sourceAxes.map((axis) => ({
              offeringId: offeringIdMap.get(axis.offeringId) as string,
              variantOptionId: variantOptionIdMap.get(axis.variantOptionId) as string,
              sortOrder: axis.sortOrder,
            })),
          );
        }
      }

      // Offering variants + variant option values
      const variantIdMap = new Map<string, string>();
      if (oldOfferingIds.length > 0) {
        const sourceVariants = await tx
          .select()
          .from(offeringVariants)
          .where(inArray(offeringVariants.offeringId, oldOfferingIds));
        for (const variant of sourceVariants) {
          const [row] = await tx
            .insert(offeringVariants)
            .values({
              offeringId: offeringIdMap.get(variant.offeringId) as string,
              sku: variant.sku,
              name: variant.name,
              price: variant.price,
              isAvailable: variant.isAvailable,
              sortOrder: variant.sortOrder,
              attributes: variant.attributes,
            })
            .returning();
          variantIdMap.set(variant.id, row.id);
        }

        const oldVariantIds = sourceVariants.map((v) => v.id);
        if (oldVariantIds.length > 0) {
          const sourceVov = await tx
            .select()
            .from(offeringVariantOptionValues)
            .where(inArray(offeringVariantOptionValues.offeringVariantId, oldVariantIds));
          if (sourceVov.length > 0) {
            await tx.insert(offeringVariantOptionValues).values(
              sourceVov.map((vov) => ({
                offeringVariantId: variantIdMap.get(vov.offeringVariantId) as string,
                variantOptionValueId: variantOptionValueIdMap.get(vov.variantOptionValueId) as string,
              })),
            );
          }

          const sourceComponents = await tx
            .select()
            .from(offeringVariantComponents)
            .where(inArray(offeringVariantComponents.offeringVariantId, oldVariantIds));
          if (sourceComponents.length > 0) {
            await tx.insert(offeringVariantComponents).values(
              sourceComponents.map((c) => ({
                offeringVariantId: variantIdMap.get(c.offeringVariantId) as string,
                inventoryItemId: c.inventoryItemId,
                quantity: c.quantity,
              })),
            );
          }
        }
      }

      // Modifier groups + options
      const groupIdMap = new Map<string, string>();
      const sourceGroups = await tx.select().from(modifierGroups).where(eq(modifierGroups.catalogId, source.id));
      for (const group of sourceGroups) {
        const [row] = await tx
          .insert(modifierGroups)
          .values({
            catalogId: newCatalog.id,
            name: group.name,
            selectionType: group.selectionType,
            minSelections: group.minSelections,
            maxSelections: group.maxSelections,
            sortOrder: group.sortOrder,
            isActive: group.isActive,
          })
          .returning();
        groupIdMap.set(group.id, row.id);
      }

      const oldGroupIds = sourceGroups.map((g) => g.id);
      if (oldGroupIds.length > 0) {
        const sourceOptions = await tx
          .select()
          .from(modifierOptions)
          .where(inArray(modifierOptions.groupId, oldGroupIds));
        if (sourceOptions.length > 0) {
          await tx.insert(modifierOptions).values(
            sourceOptions.map((opt) => ({
              groupId: groupIdMap.get(opt.groupId) as string,
              name: opt.name,
              additionalPrice: opt.additionalPrice,
              isDefault: opt.isDefault,
              isAvailable: opt.isAvailable,
              sortOrder: opt.sortOrder,
              attributes: opt.attributes,
            })),
          );
        }
      }

      // Offering ↔ modifier group attachments
      if (oldOfferingIds.length > 0) {
        const sourceLinks = await tx
          .select()
          .from(offeringModifierGroups)
          .where(inArray(offeringModifierGroups.offeringId, oldOfferingIds));
        if (sourceLinks.length > 0) {
          await tx.insert(offeringModifierGroups).values(
            sourceLinks.map((link) => ({
              offeringId: offeringIdMap.get(link.offeringId) as string,
              groupId: groupIdMap.get(link.groupId) as string,
            })),
          );
        }
      }

      return newCatalog;
    });
  }
}
