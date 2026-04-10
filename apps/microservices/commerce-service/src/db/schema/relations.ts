import { defineRelations } from '@vritti/api-sdk/drizzle-orm';
import * as schema from './index';

export const relations = defineRelations(schema, (_r) => ({
  categories: {},
  items: {},
  itemOptions: {},
  itemOptionValues: {},
  itemVariants: {},
  itemVariantOptionValues: {},
  modifierGroups: {},
  modifierOptions: {},
  itemModifierGroups: {},
  taxGroups: {},
  taxRates: {},
  itemFieldDefinitions: {},
  itemFieldValues: {},
}));
