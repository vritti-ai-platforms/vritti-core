import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { eq, inArray } from '@vritti/api-sdk/drizzle-orm';
import {
  type ModifierGroup,
  type ModifierOption,
  modifierGroups,
  modifierOptions,
  type OfferingModifierGroup,
  offeringModifierGroups,
} from '@/db/schema';

@Injectable()
export class ModifierGroupsDomainRepository extends PrimaryBaseRepository<typeof modifierGroups> {
  constructor(database: PrimaryDatabaseService) {
    super(database, modifierGroups);
  }

  // Returns modifier groups for a catalog ordered by sortOrder (RLS scopes to org + site)
  async findByCatalogId(catalogId: string): Promise<ModifierGroup[]> {
    return this.model.findMany({
      where: { catalogId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Returns paginated modifier group select results scoped to a catalog
  findForSelectByCatalog(catalogId: string, config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect({ ...config, where: { ...config.where, catalogId } });
  }

  // Returns options for a modifier group ordered by sortOrder
  async findOptionsByGroupId(groupId: string): Promise<ModifierOption[]> {
    return this.db
      .select()
      .from(modifierOptions)
      .where(eq(modifierOptions.groupId, groupId))
      .orderBy(modifierOptions.sortOrder);
  }

  // Creates a modifier option row
  async createOption(data: {
    groupId: string;
    name: string;
    additionalPrice?: bigint;
    isDefault?: boolean;
    isAvailable?: boolean;
    sortOrder?: number;
  }): Promise<ModifierOption> {
    const results = await this.db.insert(modifierOptions).values(data).returning();
    return results[0];
  }

  // Updates a modifier option by ID and returns the updated row
  async updateOption(optionId: string, data: Partial<ModifierOption>): Promise<ModifierOption> {
    const results = await this.db.update(modifierOptions).set(data).where(eq(modifierOptions.id, optionId)).returning();
    return results[0];
  }

  // Deletes a modifier option by ID
  async deleteOption(optionId: string): Promise<void> {
    await this.db.delete(modifierOptions).where(eq(modifierOptions.id, optionId));
  }

  // Finds a modifier option by ID
  async findOptionById(optionId: string): Promise<ModifierOption | undefined> {
    const results = await this.db.select().from(modifierOptions).where(eq(modifierOptions.id, optionId));
    return results[0];
  }

  // Deletes all options for a modifier group
  async deleteOptionsByGroupId(groupId: string): Promise<void> {
    await this.db.delete(modifierOptions).where(eq(modifierOptions.groupId, groupId));
  }

  // Returns offering-modifier-group links for an offering
  async findItemModifierGroups(itemId: string): Promise<OfferingModifierGroup[]> {
    return this.db.select().from(offeringModifierGroups).where(eq(offeringModifierGroups.offeringId, itemId));
  }

  // Replaces all modifier group assignments for an offering
  async saveItemModifierGroups(itemId: string, groupIds: string[]): Promise<void> {
    await this.db.delete(offeringModifierGroups).where(eq(offeringModifierGroups.offeringId, itemId));
    if (groupIds.length === 0) return;
    await this.db.insert(offeringModifierGroups).values(groupIds.map((groupId) => ({ offeringId: itemId, groupId })));
  }

  // Returns modifier groups by their IDs
  async findByIds(ids: string[]): Promise<ModifierGroup[]> {
    if (ids.length === 0) return [];
    return this.db
      .select()
      .from(modifierGroups)
      .where(inArray(modifierGroups.id, ids))
      .orderBy(modifierGroups.sortOrder);
  }

  // Deletes offering-modifier-group links for a specific group
  async deleteItemModifierGroupsByGroupId(groupId: string): Promise<void> {
    await this.db.delete(offeringModifierGroups).where(eq(offeringModifierGroups.groupId, groupId));
  }
}
