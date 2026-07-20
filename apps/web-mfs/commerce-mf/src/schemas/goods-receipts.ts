import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCurrencyField, zodNumericField } from '@vritti/quantum-ui/zod';

export const GoodsReceiptStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;

export type GoodsReceiptStatus = (typeof GoodsReceiptStatus)[keyof typeof GoodsReceiptStatus];

export const goodsReceiptStatusLabels: Record<GoodsReceiptStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
};

export const goodsReceiptStatusConfig: Record<GoodsReceiptStatus, { label: string; variant: 'default' | 'outline' }> = {
  DRAFT: { label: 'Draft', variant: 'outline' },
  PUBLISHED: { label: 'Published', variant: 'default' },
};

export const createGoodsReceiptSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  purchaseOrderId: z.string().nullable().optional(),
  receivedDate: z.string({ error: 'Received date is required' }).min(1, 'Received date is required'),
  notes: z.string().optional(),
  // Required only when supplier currency != BU currency and not inherited from a FIXED PO.
  exchangeRate: z.number().positive('Exchange rate must be greater than 0').optional(),
});
export type CreateGoodsReceiptFormData = z.infer<typeof createGoodsReceiptSchema>;

export interface GoodsReceiptPoData {
  id: string;
  poNumber: string;
  orderDate: string;
  expectedBy: string | null;
  totalAmount: { currency: string; value: string };
}

export interface GoodsReceiptData {
  id: string;
  grNumber: string;
  supplierId: string;
  status: GoodsReceiptStatus;
  isPublishable?: boolean;
  canLinkPurchaseOrder?: boolean;
  canUnlinkPurchaseOrder?: boolean;
  supplierName: string;
  supplierCurrencyCode: string;
  po: GoodsReceiptPoData | null;
  receivedDate: string;
  notes: string | null;
  exchangeRate: number;
  publishedAt: string | null;
  createdAt: string;
}

export const linkGoodsReceiptPurchaseOrderSchema = z.object({
  purchaseOrderId: z.string({ error: 'Purchase order is required' }).min(1, 'Purchase order is required'),
});
export type LinkGoodsReceiptPurchaseOrderFormData = z.infer<typeof linkGoodsReceiptPurchaseOrderSchema>;

export type InventoryTracking = 'quantity' | 'lot' | 'lot_serial' | 'serial';
export const InventoryTrackingValues = {
  QUANTITY: 'quantity' as const,
  LOT: 'lot' as const,
  LOT_SERIAL: 'lot_serial' as const,
  SERIAL: 'serial' as const,
};

export interface GoodsReceiptItemData {
  id: string;
  goodsReceiptId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemTracking: InventoryTracking;
  inventoryItemUomSymbol: string;
  inventoryItemAllowDecimal: boolean;
  inventoryItemHasMrp: boolean;
  orderedQty: number;
  freeQty: number;
  totalQty: number;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;
  acceptedQuantity: number;
  rejectedQuantity: number;
  lotsCount: number;
  linesCount: number;
  poOrderedQuantity: number | null;
  poReceivedQuantity: number | null;
  poRemainingQuantity: number | null;
  unitPrice: { currency: string; value: string } | null;
  unitCost: { currency: string; value: string } | null;
  lineTotal: { currency: string; value: string } | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface GoodsReceiptItemsCostRow {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  uomSymbol: string;
  orderedQty: number;
  freeQty: number;
  totalQty: number;
  unitPrice: { currency: string; value: string } | null;
  unitCost: { currency: string; value: string } | null;
  lineTotal: { currency: string; value: string } | null;
  mrp: { currency: string; value: string } | null;
}

export interface GoodsReceiptItemsCostData {
  rows: GoodsReceiptItemsCostRow[];
  currencyCode: string | null;
  grandTotal: { currency: string; value: string } | null;
}

export interface GoodsReceiptItemQuantRow {
  quantId: string;
  locationName: string | null;
  lotNumber: string | null;
  quantity: number;
  unitCost: { currency: string; value: string } | null;
  totalCost: { currency: string; value: string } | null;
  quantCost: { currency: string; value: string } | null;
  quantValue: { currency: string; value: string } | null;
}

export interface GoodsReceiptItemQuantsData {
  rows: GoodsReceiptItemQuantRow[];
  currencyCode: string | null;
  grandTotal: { currency: string; value: string } | null;
}

export interface GoodsReceiptLotData {
  id: string;
  goodsReceiptItemId: string;
  lotNumber: string;
  manufacturingDate: string | null;
  expiryDate: string | null;
  resolvedLotId: string | null;
  mrp: { currency: string; value: string } | null;
  linesCount: number;
  totalQuantity: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface GoodsReceiptLineData {
  id: string;
  goodsReceiptItemId: string;
  goodsReceiptLotId: string | null;
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  lotNumber: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
  quantity: number;
  primaryUomQty: number;
  primaryUomSymbol: string | null;
  resolvedQuantId: string | null;
  isBalanced: boolean;
  lineItemsCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface GoodsReceiptLineItemData {
  id: string;
  goodsReceiptLineId: string;
  serialNumber: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface GoodsReceiptTreeNode {
  id: string;
  name: string;
  kind: 'item' | 'lot' | 'line';
  balanced: boolean;
  badge: string;
  children?: GoodsReceiptTreeNode[];
}

export type GoodsReceiptsTableResponse = TableResponse<GoodsReceiptData>;
export type GoodsReceiptItemsTableResponse = TableResponse<GoodsReceiptItemData>;
export type GoodsReceiptLinesTableResponse = TableResponse<GoodsReceiptLineData>;
export type GoodsReceiptLineItemsTableResponse = TableResponse<GoodsReceiptLineItemData>;

const zOptionalNonNegativeNumber = z.number().nonnegative().optional().catch(undefined);

// GR add-item has two source shapes (supplier-item vs PO-item); server resolves row identity to (inventoryItemId, uomId); unit-price pre-filled and editable, optional.

// Operator-declared item quantity: required, integer unless UOM allows decimals, capped by PO remaining when PO-linked.
function buildOrderedQtyField(options: { allowDecimal: boolean; min?: number; max?: number }) {
  return zodNumericField({
    required: 'Ordered quantity is required',
    positive: true,
    integer: !options.allowDecimal,
    ...(options.min != null
      ? { min: options.min, minMessage: `Cannot be less than the ${options.min} already distributed across lines.` }
      : {}),
    ...(options.max != null ? { max: options.max } : {}),
  });
}

const schemeShape = {
  schemeBuyQty: zodNumericField({ integer: true, positive: true }).optional(),
  schemeFreeQty: zodNumericField({ integer: true, positive: true }).optional(),
  hasScheme: z.boolean(),
};

const enforceSchemeRatio = (
  data: { hasScheme: boolean; schemeBuyQty?: number | null; schemeFreeQty?: number | null },
  ctx: z.RefinementCtx,
) => {
  if (!data.hasScheme) return;
  if (data.schemeBuyQty == null) {
    ctx.addIssue({ code: 'custom', path: ['schemeBuyQty'], message: 'Buy qty is required for a scheme.' });
  }
  if (data.schemeFreeQty == null) {
    ctx.addIssue({ code: 'custom', path: ['schemeFreeQty'], message: 'Free qty is required for a scheme.' });
  }
};

export function buildAddGoodsReceiptItemFromSupplierItemSchema(options: { allowDecimal: boolean; max?: number }) {
  return z
    .object({
      supplierItemId: z.string({ error: 'Supplier item is required' }).uuid('Supplier item is required'),
      orderedQty: buildOrderedQtyField(options),
      rejectedQuantity: zOptionalNonNegativeNumber,
      unitPrice: zodCurrencyField({ positive: true }).optional(),
      ...schemeShape,
    })
    .superRefine(enforceSchemeRatio);
}
export type AddGoodsReceiptItemFromSupplierItemFormData = z.infer<
  ReturnType<typeof buildAddGoodsReceiptItemFromSupplierItemSchema>
>;

export function buildAddGoodsReceiptItemFromPurchaseOrderItemSchema(options: { allowDecimal: boolean; max?: number }) {
  return z
    .object({
      purchaseOrderItemId: z
        .string({ error: 'Purchase order line is required' })
        .uuid('Purchase order line is required'),
      orderedQty: buildOrderedQtyField(options),
      rejectedQuantity: zOptionalNonNegativeNumber,
      unitPrice: zodCurrencyField({ positive: true }).optional(),
      ...schemeShape,
    })
    .superRefine(enforceSchemeRatio);
}
export type AddGoodsReceiptItemFromPurchaseOrderItemFormData = z.infer<
  ReturnType<typeof buildAddGoodsReceiptItemFromPurchaseOrderItemSchema>
>;

export function buildUpdateGoodsReceiptItemSchema(options: { allowDecimal: boolean; min?: number; max?: number }) {
  return z
    .object({
      orderedQty: buildOrderedQtyField(options),
      rejectedQuantity: zOptionalNonNegativeNumber,
      unitPrice: zodCurrencyField({ positive: true }).optional(),
      ...schemeShape,
    })
    .superRefine(enforceSchemeRatio);
}
export type UpdateGoodsReceiptItemFormData = z.infer<ReturnType<typeof buildUpdateGoodsReceiptItemSchema>>;

export const addGoodsReceiptLotSchema = z
  .object({
    lotNumber: z.string().min(1, 'Lot number is required').max(100),
    manufacturingDate: z.string().nullable().optional(),
    expiryDate: z.string().min(1, 'Expiry date is required'),
    mrp: zodCurrencyField({ positive: true }).optional(),
  })
  .refine((data) => !data.manufacturingDate || new Date(data.expiryDate) > new Date(data.manufacturingDate), {
    message: 'Expiry date must be after manufacturing date',
    path: ['expiryDate'],
  });
export type AddGoodsReceiptLotFormData = z.infer<typeof addGoodsReceiptLotSchema>;

// Quantity rules depend on UOM allowDecimal, PO remaining (when linked), and current serial count; built per form mount.
export function buildAddGoodsReceiptLineSchema(options: { allowDecimal: boolean; min?: number; max?: number }) {
  return z.object({
    goodsReceiptLotId: z.string().optional(),
    locationId: z.string().min(1, 'Location is required'),
    quantity: zodNumericField({
      required: 'Quantity is required',
      positive: true,
      integer: !options.allowDecimal,
      ...(options.min != null
        ? { min: options.min, minMessage: `Cannot be less than the ${options.min} serials already on this line.` }
        : {}),
      ...(options.max != null ? { max: options.max } : {}),
    }),
  });
}
export type AddGoodsReceiptLineFormData = z.infer<ReturnType<typeof buildAddGoodsReceiptLineSchema>>;

export const addGoodsReceiptLineItemSchema = z.object({
  serialNumber: z.string().min(1, 'Serial number is required').max(100),
});
export type AddGoodsReceiptLineItemFormData = z.infer<typeof addGoodsReceiptLineItemSchema>;
