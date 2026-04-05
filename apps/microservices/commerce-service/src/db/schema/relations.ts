import { defineRelations } from '@vritti/api-sdk/drizzle-orm';
import * as schema from './index';

export const relations = defineRelations(schema, (_r) => ({
  categories: {},
  catalogItems: {},
  itemImages: {},
  itemOptions: {},
  itemOptionValues: {},
  itemVariants: {},
  itemVariantOptionValues: {},
  modifierGroups: {},
  modifierOptions: {},
  itemModifierGroups: {},
  taxGroups: {},
}));
