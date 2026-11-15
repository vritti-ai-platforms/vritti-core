import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodNumericField } from '@vritti/quantum-ui/zod';
import type { SiteStockLocationData, StockStatus } from './inventory-items';

export interface ItemStockLevelsData {
  id: string;
  reorderPoint: number;
  safetyStock: number;
  maxStockLevel: number;
}

export interface SiteStockLevelData {
  siteId: string;
  siteName: string;
  siteCode: string;
  hasStockLevels: boolean;
  stockLevelId: string | null;
  reorderPoint: number | null;
  safetyStock: number | null;
  maxStockLevel: number | null;
  onHand: number;
  stockValue: CurrencyValue;
  stockStatus: StockStatus | null;
  locations: SiteStockLocationData[];
}

export type SiteStockLevelsTableResponse = TableResponse<SiteStockLevelData>;

// Every level is nullable so an empty input stays controlled; which ones are required is checked below
const stockLevelsFields = z.object({
  reorderPoint: zodNumericField({ min: 0, nullable: true }),
  safetyStock: zodNumericField({ min: 0, nullable: true }),
  maxStockLevel: zodNumericField({ min: 0, nullable: true }),
});

// The reorder point and max level are required and the levels stack: a max level above 0, the reorder point at most
// the max level and the safety stock at most the reorder point
function checkStockLevels(
  levels: { reorderPoint: number | null; safetyStock: number | null; maxStockLevel: number | null },
  ctx: z.RefinementCtx,
) {
  const { reorderPoint, safetyStock, maxStockLevel } = levels;
  if (reorderPoint === null)
    ctx.addIssue({ code: 'custom', path: ['reorderPoint'], message: 'Reorder point is required' });
  if (maxStockLevel === null)
    ctx.addIssue({ code: 'custom', path: ['maxStockLevel'], message: 'Max level is required' });
  else if (maxStockLevel <= 0) ctx.addIssue({ code: 'custom', path: ['maxStockLevel'], message: 'Must be above 0' });
  else if (reorderPoint !== null && reorderPoint > maxStockLevel) {
    ctx.addIssue({ code: 'custom', path: ['reorderPoint'], message: 'Must be at most the max level' });
  }
  if (reorderPoint !== null && (safetyStock ?? 0) > reorderPoint) {
    ctx.addIssue({ code: 'custom', path: ['safetyStock'], message: 'Must be at most the reorder point' });
  }
}

// An item's stock levels at the current site
export const stockLevelsSchema = stockLevelsFields.superRefine(checkStockLevels);

// Sets the stock levels of an item picked from those the current site has none for
export const setStockLevelsSchema = stockLevelsFields
  .extend({ inventoryItemId: z.uuid('Inventory item is required') })
  .superRefine(checkStockLevels);

// Sets the item's stock levels at a site picked from those of the legal entity that have none
export const setSiteStockLevelsSchema = stockLevelsFields
  .extend({ siteId: z.uuid('Site is required') })
  .superRefine(checkStockLevels);

export type StockLevelsFormData = z.infer<typeof stockLevelsSchema>;
export type SetStockLevelsFormData = z.infer<typeof setStockLevelsSchema>;
export type SetSiteStockLevelsFormData = z.infer<typeof setSiteStockLevelsSchema>;

// An empty safety stock is sent as 0
export type StockLevelsPayload = { reorderPoint: number; safetyStock: number; maxStockLevel: number };

export type SiteStockLevelsPayload = {
  siteId: string;
  data: StockLevelsPayload;
};
