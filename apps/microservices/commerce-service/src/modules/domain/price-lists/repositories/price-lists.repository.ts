import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk';
import { and, asc, eq, ilike, inArray, or, sql, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  categories,
  items,
  itemVariants,
  type ItemVariant,
  priceListItems,
  type PriceList,
  type PriceListItem,
  priceLists,
  type TerminalPriceList,
  terminalPriceLists,
} from '@/db/schema';

@Injectable()
export class PriceListsRepository extends PrimaryBaseRepository<typeof priceLists> {
  constructor(database: PrimaryDatabaseService) {
    super(database, priceLists);
  }

  // Returns paginated price list options for select dropdowns
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Returns paginated price lists with assignment counts for table display
  async findForTable(options: {
    where?: SQL;
    orderBy?: SQL[];
    limit: number;
    offset: number;
  }): Promise<{
    result: (PriceList & { assignedItemsCount: number; assignedTerminalsCount: number })[];
    count: number;
  }> {
    return this.findAllAndCount<PriceList & { assignedItemsCount: number; assignedTerminalsCount: number }>({
      select: {
        id: priceLists.id,
        organizationId: priceLists.organizationId,
        businessUnitId: priceLists.businessUnitId,
        name: priceLists.name,
        code: priceLists.code,
        description: priceLists.description,
        isActive: priceLists.isActive,
        createdAt: priceLists.createdAt,
        updatedAt: priceLists.updatedAt,
        assignedItemsCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${priceListItems} pli
          WHERE pli.price_list_id = ${priceLists.id}
        )`,
        assignedTerminalsCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${terminalPriceLists} tpl
          WHERE tpl.price_list_id = ${priceLists.id}
        )`,
      },
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns a price list by ID with assignment counts
  async findByIdWithStats(
    id: string,
  ): Promise<(PriceList & { assignedItemsCount: number; assignedTerminalsCount: number }) | undefined> {
    const rows = await this.db
      .select({
        id: priceLists.id,
        organizationId: priceLists.organizationId,
        businessUnitId: priceLists.businessUnitId,
        name: priceLists.name,
        code: priceLists.code,
        description: priceLists.description,
        isActive: priceLists.isActive,
        createdAt: priceLists.createdAt,
        updatedAt: priceLists.updatedAt,
        assignedItemsCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${priceListItems} pli
          WHERE pli.price_list_id = ${priceLists.id}
        )`,
        assignedTerminalsCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${terminalPriceLists} tpl
          WHERE tpl.price_list_id = ${priceLists.id}
        )`,
      })
      .from(priceLists)
      .where(eq(priceLists.id, id))
      .limit(1);

    return rows[0] as (PriceList & { assignedItemsCount: number; assignedTerminalsCount: number }) | undefined;
  }

  // Returns all price list IDs that exist from the provided list
  async findExistingPriceListIds(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];
    const rows = await this.db.select({ id: priceLists.id }).from(priceLists).where(inArray(priceLists.id, ids));
    return rows.map((row) => row.id);
  }

  // Returns item variants by IDs for availability validation
  async findItemVariantsByIds(ids: string[]): Promise<Pick<ItemVariant, 'id' | 'isAvailable'>[]> {
    if (ids.length === 0) return [];
    return this.db
      .select({ id: itemVariants.id, isAvailable: itemVariants.isAvailable })
      .from(itemVariants)
      .where(inArray(itemVariants.id, ids));
  }

  // Returns item assignments for a price list with variant and item details
  async findPriceListItems(
    priceListId: string,
  ): Promise<
    (PriceListItem & {
      itemVariantId: string;
      itemVariantSku: string;
      itemVariantName: string;
      itemId: string;
      itemName: string;
      basePrice: bigint;
      categoryName: string | null;
    })[]
  > {
    return this.db
      .select({
        organizationId: priceListItems.organizationId,
        businessUnitId: priceListItems.businessUnitId,
        priceListId: priceListItems.priceListId,
        itemVariantId: priceListItems.itemVariantId,
        sortOrder: priceListItems.sortOrder,
        isVisible: priceListItems.isVisible,
        priceOverride: priceListItems.priceOverride,
        createdAt: priceListItems.createdAt,
        updatedAt: priceListItems.updatedAt,
        itemVariantSku: itemVariants.sku,
        itemVariantName: itemVariants.name,
        itemId: itemVariants.itemId,
        itemName: items.name,
        basePrice: itemVariants.price,
        categoryName: categories.name,
      })
      .from(priceListItems)
      .innerJoin(itemVariants, eq(priceListItems.itemVariantId, itemVariants.id))
      .innerJoin(items, eq(itemVariants.itemId, items.id))
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(eq(priceListItems.priceListId, priceListId))
      .orderBy(asc(priceListItems.sortOrder), asc(items.name), asc(itemVariants.sortOrder));
  }

  // Replaces all price list item assignments for a price list
  async replacePriceListItems(
    priceListId: string,
    itemAssignments: Array<{ itemVariantId: string; sortOrder: number; isVisible: boolean; priceOverride: bigint | null }>,
  ): Promise<void> {
    await this.db.delete(priceListItems).where(eq(priceListItems.priceListId, priceListId));

    if (itemAssignments.length === 0) return;

    await this.db.insert(priceListItems).values(
      itemAssignments.map((item) => ({
        priceListId,
        itemVariantId: item.itemVariantId,
        sortOrder: item.sortOrder,
        isVisible: item.isVisible,
        priceOverride: item.priceOverride,
      })),
    );
  }

  // Returns price list assignments for a terminal
  async findTerminalPriceLists(
    terminalId: string,
  ): Promise<(TerminalPriceList & { priceListName: string; priceListCode: string })[]> {
    return this.db
      .select({
        organizationId: terminalPriceLists.organizationId,
        businessUnitId: terminalPriceLists.businessUnitId,
        terminalId: terminalPriceLists.terminalId,
        priceListId: terminalPriceLists.priceListId,
        priority: terminalPriceLists.priority,
        isDefault: terminalPriceLists.isDefault,
        createdAt: terminalPriceLists.createdAt,
        updatedAt: terminalPriceLists.updatedAt,
        priceListName: priceLists.name,
        priceListCode: priceLists.code,
      })
      .from(terminalPriceLists)
      .innerJoin(priceLists, eq(terminalPriceLists.priceListId, priceLists.id))
      .where(eq(terminalPriceLists.terminalId, terminalId))
      .orderBy(asc(terminalPriceLists.priority), asc(priceLists.name));
  }

  // Replaces all price list assignments for a terminal
  async replaceTerminalPriceLists(
    terminalId: string,
    assignments: Array<{ priceListId: string; priority: number; isDefault: boolean }>,
  ): Promise<void> {
    await this.db.delete(terminalPriceLists).where(eq(terminalPriceLists.terminalId, terminalId));

    if (assignments.length === 0) return;

    await this.db.insert(terminalPriceLists).values(
      assignments.map((assignment) => ({
        terminalId,
        priceListId: assignment.priceListId,
        priority: assignment.priority,
        isDefault: assignment.isDefault,
      })),
    );
  }

  // Returns terminal sellable rows from assigned price lists ordered by assignment priority and item sort
  async findTerminalSellableRows(terminalId: string): Promise<
    Array<{
      terminalId: string;
      priceListId: string;
      priceListName: string;
      itemVariantId: string;
      itemVariantSku: string;
      itemVariantName: string;
      itemId: string;
      itemName: string;
      basePrice: bigint;
      categoryName: string | null;
      priceOverride: bigint | null;
      priority: number;
      sortOrder: number;
    }>
  > {
    return this.db
      .select({
        terminalId: terminalPriceLists.terminalId,
        priceListId: priceLists.id,
        priceListName: priceLists.name,
        itemVariantId: itemVariants.id,
        itemVariantSku: itemVariants.sku,
        itemVariantName: itemVariants.name,
        itemId: itemVariants.itemId,
        itemName: items.name,
        basePrice: itemVariants.price,
        categoryName: categories.name,
        priceOverride: priceListItems.priceOverride,
        priority: terminalPriceLists.priority,
        sortOrder: priceListItems.sortOrder,
      })
      .from(terminalPriceLists)
      .innerJoin(priceLists, eq(terminalPriceLists.priceListId, priceLists.id))
      .innerJoin(priceListItems, eq(priceListItems.priceListId, priceLists.id))
      .innerJoin(itemVariants, eq(priceListItems.itemVariantId, itemVariants.id))
      .innerJoin(items, eq(itemVariants.itemId, items.id))
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(
        and(
          eq(terminalPriceLists.terminalId, terminalId),
          eq(priceLists.isActive, true),
          eq(priceListItems.isVisible, true),
        ),
      )
      .orderBy(asc(terminalPriceLists.priority), asc(priceListItems.sortOrder), asc(items.name));
  }

  // Returns item variants with parent item name for the price list select dropdown
  async findItemVariantsForSelect(search?: string): Promise<SelectQueryResult> {
    const whereCondition = search
      ? and(
          eq(itemVariants.isAvailable, true),
          or(
            ilike(itemVariants.name, `%${search}%`),
            ilike(items.name, `%${search}%`),
            ilike(itemVariants.sku, `%${search}%`),
          ),
        )
      : eq(itemVariants.isAvailable, true);

    const rows = await this.db
      .select({
        id: itemVariants.id,
        name: itemVariants.name,
        description: items.name,
      })
      .from(itemVariants)
      .innerJoin(items, eq(itemVariants.itemId, items.id))
      .where(whereCondition)
      .orderBy(asc(items.name), asc(itemVariants.sortOrder));

    return {
      options: rows.map((row) => ({
        value: row.id,
        label: row.name,
        description: row.description,
      })),
      hasMore: false,
      totalCount: rows.length,
    };
  }
}
