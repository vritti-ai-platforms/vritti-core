import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { eq, inArray } from '@vritti/api-sdk/drizzle-orm';
import {
  type ItemModifierGroup,
  type ModifierGroup,
  type ModifierOption,
  itemModifierGroups,
  modifierGroups,
  modifierOptions,
} from '@/db/schema';

@Injectable()
export class ModifierGroupsRepository extends PrimaryBaseRepository<typeof modifierGroups> {
  constructor(database: PrimaryDatabaseService) {
    super(database, modifierGroups);
  }

  // Returns all modifier groups ordered by sortOrder (RLS scopes to org + BU)
  async findAll(): Promise<ModifierGroup[]> {
    return this.model.findMany({
      orderBy: { sortOrder: 'asc' },
    });
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
    additionalPrice?: string;
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

  // Returns item-modifier-group links for an item
  async findItemModifierGroups(itemId: string): Promise<ItemModifierGroup[]> {
    return this.db
      .select()
      .from(itemModifierGroups)
      .where(eq(itemModifierGroups.itemId, itemId));
  }

  // Replaces all modifier group assignments for an item
  async saveItemModifierGroups(itemId: string, groupIds: string[]): Promise<void> {
    await this.db.delete(itemModifierGroups).where(eq(itemModifierGroups.itemId, itemId));
    if (groupIds.length === 0) return;
    await this.db.insert(itemModifierGroups).values(groupIds.map((groupId) => ({ itemId, groupId })));
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

  // Deletes item-modifier-group links for a specific group
  async deleteItemModifierGroupsByGroupId(groupId: string): Promise<void> {
    await this.db.delete(itemModifierGroups).where(eq(itemModifierGroups.groupId, groupId));
  }
}
