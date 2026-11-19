import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import { PRIMARY_UNIT_PLACEHOLDER, quantityPlaceholder } from '@vritti/quantum-ui/QuantityField';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodNumericField } from '@vritti/quantum-ui/zod';
import type { SiteStockDisplay, SiteStockLocationData, StockStatus } from './inventory-items';

// Whether a site may buy an item it carries; a blocked item still receives, moves and sells the stock it has
export const SiteItemStatusValues = {
  ACTIVE: 'ACTIVE',
  BLOCKED: 'BLOCKED',
} as const;
export type SiteItemStatus = (typeof SiteItemStatusValues)[keyof typeof SiteItemStatusValues];

// How a site restocks an item: by hand, or when stock falls to its reorder point
export const ReplenishmentMethodValues = {
  MANUAL: 'MANUAL',
  REORDER_POINT: 'REORDER_POINT',
} as const;
export type ReplenishmentMethod = (typeof ReplenishmentMethodValues)[keyof typeof ReplenishmentMethodValues];

export const replenishmentConfig: Record<ReplenishmentMethod, { label: string; description: string }> = {
  [ReplenishmentMethodValues.REORDER_POINT]: {
    label: 'Reorder Point',
    description: 'Reorder when stock falls to the reorder point, up to the maximum stock',
  },
  [ReplenishmentMethodValues.MANUAL]: {
    label: 'Manual',
    description: 'Buy it when needed; no levels are kept',
  },
};

export const replenishmentOptions = [ReplenishmentMethodValues.REORDER_POINT, ReplenishmentMethodValues.MANUAL].map(
  (value) => ({ value, ...replenishmentConfig[value] }),
);

export interface InventoryItemSiteData {
  id: string;
  siteId: string;
  status: SiteItemStatus;
  blockedReason: string | null;
  blockedAt: string | null;
  replenishment: ReplenishmentMethod;
  safetyStock: number | null;
  reorderPoint: number | null;
  maxStock: number | null;
  supplierItemsRequired: boolean;
}

export interface SiteItemRowData {
  siteId: string;
  siteName: string;
  siteCode: string;
  atSite: boolean;
  siteItemId: string | null;
  siteItemStatus: SiteItemStatus | null;
  blockedReason: string | null;
  replenishment: ReplenishmentMethod | null;
  reorderPoint: number | null;
  safetyStock: number | null;
  maxStock: number | null;
  supplierItemsRequired: boolean;
  onHand: number;
  stockValue: CurrencyValue;
  stockStatus: StockStatus | null;
  locations: SiteStockLocationData[];
  display: SiteStockDisplay;
}

export type SiteItemsTableResponse = TableResponse<SiteItemRowData>;

export interface ReplenishmentBounds {
  reorderPoint: number | null;
  allowDecimal: boolean;
}

const WHOLE_PRIMARY_UNIT = `Must come to a whole number of ${PRIMARY_UNIT_PLACEHOLDER}`;

// The replenishment fields, every level nullable so an empty input stays controlled: the safety stock at most the
// reorder point and the maximum stock at least it once one is entered, each a whole number in a unit that cannot be split
function replenishmentFields({ reorderPoint, allowDecimal }: ReplenishmentBounds) {
  const bound = reorderPoint !== null && Number.isFinite(reorderPoint) && reorderPoint > 0 ? reorderPoint : undefined;
  const integer = !allowDecimal;
  return z.object({
    replenishment: z.enum(ReplenishmentMethodValues),
    safetyStock: zodNumericField({
      min: 0,
      max: bound,
      maxMessage: `Must be at most the reorder point (${bound === undefined ? '' : quantityPlaceholder(bound)})`,
      integer,
      integerMessage: WHOLE_PRIMARY_UNIT,
      nullable: true,
    }),
    reorderPoint: zodNumericField({ positive: true, integer, integerMessage: WHOLE_PRIMARY_UNIT, nullable: true }),
    maxStock: zodNumericField({
      positive: true,
      min: bound,
      minMessage: `Must be at least the reorder point (${bound === undefined ? '' : quantityPlaceholder(bound)})`,
      integer,
      integerMessage: WHOLE_PRIMARY_UNIT,
      nullable: true,
    }),
  });
}

type ReplenishmentFields = z.infer<ReturnType<typeof replenishmentFields>>;

// A reorder point needs a reorder point and a maximum stock; manual replenishment keeps no levels, so nothing is checked
function checkReplenishment(fields: ReplenishmentFields, ctx: z.RefinementCtx) {
  if (fields.replenishment === ReplenishmentMethodValues.MANUAL) return;
  if (fields.reorderPoint === null) {
    ctx.addIssue({ code: 'custom', path: ['reorderPoint'], message: 'Reorder point is required' });
  }
  if (fields.maxStock === null) {
    ctx.addIssue({ code: 'custom', path: ['maxStock'], message: 'Maximum stock is required' });
  }
}

// How the current site replenishes an item it carries, bounded by the reorder point entered
export function buildReplenishmentSchema(bounds: ReplenishmentBounds) {
  return replenishmentFields(bounds).superRefine(checkReplenishment);
}

// Adds an item picked from those the current site does not carry
export function buildAddToSiteSchema(bounds: ReplenishmentBounds) {
  return replenishmentFields(bounds)
    .extend({ inventoryItemId: z.uuid('Inventory item is required') })
    .superRefine(checkReplenishment);
}

// Adds the item to a site picked from those of the legal entity that do not carry it
export function buildAddToLeSiteSchema(bounds: ReplenishmentBounds) {
  return replenishmentFields(bounds)
    .extend({ siteId: z.uuid('Site is required') })
    .superRefine(checkReplenishment);
}

// Why the site stops buying the item
export const blockSiteItemSchema = z.object({
  reason: z.string({ error: 'Reason is required' }).trim().min(1, 'Reason is required').max(500),
});

export type ReplenishmentFormData = z.infer<ReturnType<typeof buildReplenishmentSchema>>;
export type AddToSiteFormData = z.infer<ReturnType<typeof buildAddToSiteSchema>>;
export type AddToLeSiteFormData = z.infer<ReturnType<typeof buildAddToLeSiteSchema>>;
export type BlockSiteItemFormData = z.infer<typeof blockSiteItemSchema>;

export type ReplenishmentPayload = ReplenishmentFields;

// The levels sent for the form's method: manual replenishment sends none
export function replenishmentPayload(fields: ReplenishmentFields): ReplenishmentPayload {
  if (fields.replenishment === ReplenishmentMethodValues.MANUAL) {
    return { replenishment: fields.replenishment, safetyStock: null, reorderPoint: null, maxStock: null };
  }
  return {
    replenishment: fields.replenishment,
    safetyStock: fields.safetyStock,
    reorderPoint: fields.reorderPoint,
    maxStock: fields.maxStock,
  };
}
