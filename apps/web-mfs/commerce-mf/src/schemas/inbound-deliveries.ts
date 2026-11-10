import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodNumericField } from '@vritti/quantum-ui/zod';

export type InboundDeliveryStatus =
  | 'PLANNED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

export type InboundDeliverySource = 'ANNOUNCED' | 'RECEIPT';

export const inboundDeliverySourceConfig: Record<InboundDeliverySource, { label: string }> = {
  ANNOUNCED: { label: 'Announced' },
  RECEIPT: { label: 'From Receipt' },
};

export type ManualInboundDeliveryStatus = Extract<InboundDeliveryStatus, 'IN_TRANSIT' | 'ARRIVED' | 'CANCELLED'>;

export const inboundDeliveryStatusConfig: Record<
  InboundDeliveryStatus,
  { label: string; variant: 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' }
> = {
  PLANNED: { label: 'Planned', variant: 'outline' },
  IN_TRANSIT: { label: 'In Transit', variant: 'secondary' },
  ARRIVED: { label: 'Arrived', variant: 'success' },
  PARTIALLY_RECEIVED: { label: 'Partially Received', variant: 'warning' },
  RECEIVED: { label: 'Received', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

export const manualInboundDeliveryStatusTransitions: Record<InboundDeliveryStatus, ManualInboundDeliveryStatus[]> = {
  PLANNED: ['IN_TRANSIT', 'ARRIVED', 'CANCELLED'],
  IN_TRANSIT: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['CANCELLED'],
  PARTIALLY_RECEIVED: [],
  RECEIVED: [],
  CANCELLED: [],
};

export interface InboundDeliveryData {
  id: string;
  deliveryNumber: string;
  legalEntityId: string;
  siteId: string;
  siteName?: string | null;
  siteCode?: string | null;
  supplierId: string;
  supplierName: string;
  status: InboundDeliveryStatus;
  source: InboundDeliverySource;
  expectedDeliveryDate: string;
  carrier: string | null;
  trackingNumber: string | null;
  supplierDeliveryNoteNumber: string | null;
  supplierDeliveryNoteDate: string | null;
  notes: string | null;
  lineCount: number;
  poNumbers: string[];
  goodsReceiptCount: number;
  draftGoodsReceiptId: string | null;
  sourceGoodsReceiptId: string | null;
  sourceGrNumber: string | null;
  isEditable: boolean;
  canCancel: boolean;
  canDelete: boolean;
  canReceive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InboundDeliveryLineData {
  id: string;
  inboundDeliveryId: string;
  purchaseOrderItemId: string;
  purchaseOrderId: string;
  poNumber: string;
  poStatus: string;
  inventoryItemId: string;
  inventoryItemName: string;
  uomId: string;
  uomSymbol: string | null;
  allowDecimal: boolean;
  orderedQty: number;
  poReceivedQty: number;
  quantity: number;
  receivedOnDeliveryQty: number;
  openQty: number;
  maxQuantity: number;
  createdAt: string;
}

export type InboundDeliveriesTableResponse = TableResponse<InboundDeliveryData>;
export type InboundDeliveryLinesTableResponse = TableResponse<InboundDeliveryLineData>;

export interface CreateInboundDeliveryPayload {
  supplierId: string;
  expectedDeliveryDate: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  supplierDeliveryNoteNumber?: string | null;
  supplierDeliveryNoteDate?: string | null;
  notes?: string | null;
}

export interface UpdateInboundDeliveryPayload {
  id: string;
  expectedDeliveryDate?: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  supplierDeliveryNoteNumber?: string | null;
  supplierDeliveryNoteDate?: string | null;
  notes?: string | null;
}

export interface UpdateInboundDeliveryStatusPayload {
  id: string;
  status: ManualInboundDeliveryStatus;
}

export interface InboundDeliveryLineInput {
  purchaseOrderItemId: string;
  quantity: number;
}

export interface AddInboundDeliveryLinesPayload {
  id: string;
  lines: InboundDeliveryLineInput[];
}

export interface InboundDeliveryLineRef {
  id: string;
  lineId: string;
}

export interface UpdateInboundDeliveryLinePayload extends InboundDeliveryLineRef {
  quantity: number;
}

export interface ReceiveInboundDeliveryPayload {
  id: string;
  receivedDate: string;
  notes?: string | null;
}

export interface DeliverablePurchaseOrderLine {
  purchaseOrderItemId: string;
  inventoryItemName: string;
  poNumber: string;
  uomSymbol: string;
  allowDecimal: boolean;
  orderedQty: number;
  receivedQty: number;
  deliverableQty: number;
}

const expectedDeliveryDateField = z
  .string({ error: 'Expected delivery date is required' })
  .min(1, 'Expected delivery date is required');

export const supplierDeliveryNoteShape = {
  supplierDeliveryNoteNumber: z.string().max(100, 'At most 100 characters'),
  supplierDeliveryNoteDate: z.string().nullish(),
};

const deliveryDetailsShape = {
  expectedDeliveryDate: expectedDeliveryDateField,
  carrier: z.string(),
  trackingNumber: z.string(),
  ...supplierDeliveryNoteShape,
  notes: z.string(),
};

// An announced delivery's note is issued before the goods arrive, so it cannot be dated after the expected day
function noteDatedByExpectedDay(data: { expectedDeliveryDate: string; supplierDeliveryNoteDate?: string | null }) {
  return !data.supplierDeliveryNoteDate || data.supplierDeliveryNoteDate <= data.expectedDeliveryDate;
}

const noteDateRefinement = {
  message: 'Cannot be after the expected delivery date',
  path: ['supplierDeliveryNoteDate'],
};

export const createInboundDeliverySchema = z
  .object({
    supplierId: z.uuid('Supplier is required'),
    ...deliveryDetailsShape,
  })
  .refine(noteDatedByExpectedDay, noteDateRefinement);

export type CreateInboundDeliveryFormData = z.infer<typeof createInboundDeliverySchema>;

export const updateInboundDeliverySchema = z
  .object(deliveryDetailsShape)
  .refine(noteDatedByExpectedDay, noteDateRefinement);

export type UpdateInboundDeliveryFormData = z.infer<typeof updateInboundDeliverySchema>;

export const receiveInboundDeliverySchema = z.object({
  receivedDate: z.string({ error: 'Received date is required' }).min(1, 'Received date is required'),
  notes: z.string(),
});

export type ReceiveInboundDeliveryFormData = z.infer<typeof receiveInboundDeliverySchema>;

// `findLine` resolves a picked purchase order line, so each quantity is checked against what is still left to deliver
// of it and against its unit
export function buildAddInboundDeliveryLinesSchema(
  findLine: (purchaseOrderItemId: string) => DeliverablePurchaseOrderLine | undefined,
) {
  return z.object({
    lines: z
      .array(
        z.object({
          purchaseOrderItemId: z.uuid('Purchase order line is required'),
          quantity: zodNumericField({ required: 'Quantity is required', positive: true }),
        }),
      )
      .min(1, 'Pick at least one purchase order line')
      .superRefine((lines, ctx) => {
        lines.forEach((line, index) => {
          const picked = findLine(line.purchaseOrderItemId);
          if (!picked) return;
          if (!picked.allowDecimal && !Number.isInteger(line.quantity)) {
            ctx.addIssue({ code: 'custom', path: [index, 'quantity'], message: 'Must be a whole number' });
          } else if (line.quantity > picked.deliverableQty) {
            ctx.addIssue({
              code: 'custom',
              path: [index, 'quantity'],
              message: `Cannot exceed what is left to deliver (${picked.deliverableQty}).`,
            });
          }
        });
      }),
  });
}

export type AddInboundDeliveryLinesFormData = z.infer<ReturnType<typeof buildAddInboundDeliveryLinesSchema>>;

// A line cannot drop below what has been received against it on this delivery, nor rise past what the PO line has open
export function buildUpdateInboundDeliveryLineSchema({
  min,
  max,
  allowDecimal,
}: {
  min: number;
  max: number;
  allowDecimal: boolean;
}) {
  return z.object({
    quantity: zodNumericField({
      required: 'Quantity is required',
      positive: true,
      integer: !allowDecimal,
      max,
      maxMessage: `Cannot exceed what the purchase order line has open (${max}).`,
      ...(min > 0 ? { min, minMessage: `Cannot be less than already received on this delivery (${min}).` } : {}),
    }),
  });
}

export type UpdateInboundDeliveryLineFormData = z.infer<ReturnType<typeof buildUpdateInboundDeliveryLineSchema>>;
