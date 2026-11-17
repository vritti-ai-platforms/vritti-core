import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import Decimal from '@vritti/quantum-ui/decimal';
import { z, zodCurrencyField, zodNumericField } from '@vritti/quantum-ui/zod';
import { type PurchaseRef, type PurchaseType, requireForeignRate } from './purchases';
import type { SupplierInvoiceHold } from './supplier-invoices';

export const ReceiveWithInvoiceStatusValues = {
  DRAFT: 'DRAFT',
  POSTED: 'POSTED',
} as const;
export type ReceiveWithInvoiceStatus =
  (typeof ReceiveWithInvoiceStatusValues)[keyof typeof ReceiveWithInvoiceStatusValues];

export interface ReceiveWithInvoiceOpenLine {
  allocationId: string;
  purchaseId: string;
  purchaseNumber: string;
  purchaseSupplierId: string;
  legType: PurchaseType;
  inventoryItemId: string;
  inventoryItemName: string;
  isLotTracked: boolean;
  uomId: string;
  uomSymbol: string;
  primaryUomSymbol: string;
  allocatedQty: number;
  receivedQty: number;
  openQty: number;
  unitPrice: CurrencyValue;
  isPriced: boolean;
  purchaseOrderItemId: string | null;
  orderBlockedReason: string | null;
}

export interface ReceiveWithInvoiceLinePayload {
  allocationId: string;
  quantity: number;
  freeQty: number;
  unitPrice: CurrencyValue;
  discountAmount?: CurrencyValue;
  taxAmount?: CurrencyValue;
  lotNumber?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  mrp?: CurrencyValue;
  locationId?: string;
}

export interface ReceiveWithInvoicePayload {
  siteId?: string;
  supplierId: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxDate?: string;
  currencyCode: string;
  exchangeRate?: number;
  receivedDate: string;
  defaultLocationId: string;
  supplierDeliveryNoteNumber?: string;
  notes?: string;
  lines: ReceiveWithInvoiceLinePayload[];
}

export interface ReceiveWithInvoiceLine {
  allocationId: string;
  inventoryItemName: string;
  uomSymbol: string;
  isLotTracked: boolean;
  purchaseId: string;
  purchaseNumber: string;
  quantity: number;
  freeQty: number;
  unitPrice: CurrencyValue;
  discountAmount: CurrencyValue;
  taxAmount: CurrencyValue;
  lotNumber: string | null;
  expiryDate: string | null;
  manufacturingDate: string | null;
  mrp: CurrencyValue;
  locationId: string | null;
}

export interface ReceiveWithInvoiceDetail {
  supplierInvoiceId: string;
  siteId: string;
  status: ReceiveWithInvoiceStatus;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxDate: string | null;
  currencyCode: string;
  exchangeRate: number | null;
  receivedDate: string;
  defaultLocationId: string;
  supplierDeliveryNoteNumber: string | null;
  notes: string | null;
  lines: ReceiveWithInvoiceLine[];
  purchases: PurchaseRef[];
  goodsReceipts: { id: string; grNumber: string }[];
  holds: SupplierInvoiceHold[];
}

export interface ReceiveWithInvoiceOpenLinesParams {
  supplierId: string;
  siteId?: string;
  excludeInvoiceId?: string;
}

export interface ReceiveWithInvoiceOpenLinesQuery {
  supplierId?: string;
  siteId?: string;
  excludeInvoiceId?: string;
}

export interface CreatedReceiveWithInvoice {
  supplierInvoiceId: string;
}

export interface UpdateReceiveWithInvoiceVars {
  invoiceId: string;
  data: ReceiveWithInvoicePayload;
}

const requiredMoney = (message: string) =>
  zodCurrencyField({ required: message }).pipe(z.object({ currency: z.string(), value: z.string() }));

const receiveWithInvoiceLineShape = {
  allocationId: z.uuid('Item is required'),
  quantity: zodNumericField({ required: 'Quantity is required', positive: true, nonZero: true }),
  freeQty: zodNumericField({ required: 'Free quantity is required', min: 0 }),
  unitPrice: requiredMoney('Unit price is required'),
  discountAmount: zodCurrencyField({ optional: true }),
  taxAmount: zodCurrencyField({ optional: true }),
  lotNumber: z.string().trim().max(100, 'Batch must be at most 100 characters'),
  expiryDate: z.string().nullish(),
  manufacturingDate: z.string().nullish(),
  mrp: zodCurrencyField({ optional: true }),
  locationId: z.uuid().optional(),
};

// `findOpenLine` resolves the picked allocation, so the quantity stays within what is left to receive of it and a
// lot-tracked item gets its batch and expiry, and its MRP where the user may set one
export function buildReceiveWithInvoiceLineSchema({
  findOpenLine,
  mrpRequired,
}: {
  findOpenLine: (allocationId: string) => ReceiveWithInvoiceOpenLine | undefined;
  mrpRequired: boolean;
}) {
  return z.object(receiveWithInvoiceLineShape).superRefine((line, ctx) => {
    const openLine = findOpenLine(line.allocationId);
    if (!openLine) return;
    if (new Decimal(line.quantity).gt(openLine.openQty)) {
      ctx.addIssue({
        code: 'custom',
        path: ['quantity'],
        message: `Cannot exceed what is left to receive (${openLine.openQty}).`,
      });
    }
    if (!openLine.isLotTracked) return;
    if (!line.lotNumber) {
      ctx.addIssue({ code: 'custom', path: ['lotNumber'], message: 'Batch is required for a batch-tracked item' });
    }
    if (!line.expiryDate) {
      ctx.addIssue({ code: 'custom', path: ['expiryDate'], message: 'Expiry is required for a batch-tracked item' });
    }
    if (mrpRequired && !line.mrp?.value) {
      ctx.addIssue({ code: 'custom', path: ['mrp'], message: 'MRP is required for a batch-tracked item' });
    }
    if (line.manufacturingDate && line.expiryDate && line.manufacturingDate > line.expiryDate) {
      ctx.addIssue({ code: 'custom', path: ['manufacturingDate'], message: 'Cannot be after the expiry date' });
    }
  });
}

export type ReceiveWithInvoiceLineFormValues = z.input<ReturnType<typeof buildReceiveWithInvoiceLineSchema>>;
export type ReceiveWithInvoiceLineFormData = z.output<ReturnType<typeof buildReceiveWithInvoiceLineSchema>>;

// The supplier invoice header with its lines; the exchange rate is asked only for a currency other than the legal entity's
export function buildReceiveWithInvoiceSchema({ leCurrencyCode }: { leCurrencyCode: string }) {
  return z
    .object({
      supplierId: z.uuid('Supplier is required'),
      invoiceNumber: z
        .string({ error: 'Invoice number is required' })
        .trim()
        .min(1, 'Invoice number is required')
        .max(100, 'Invoice number must be at most 100 characters'),
      invoiceDate: z.string({ error: 'Invoice date is required' }).min(1, 'Invoice date is required'),
      taxDate: z.string({ error: 'Tax date is required' }).min(1, 'Tax date is required'),
      currencyCode: z.string({ error: 'Currency is required' }).regex(/^[A-Z]{3}$/, 'Currency is required'),
      exchangeRate: zodNumericField({ positive: true, nonZero: true }).optional(),
      receivedDate: z.string({ error: 'Received date is required' }).min(1, 'Received date is required'),
      defaultLocationId: z.uuid('Default location is required'),
      supplierDeliveryNoteNumber: z.string().trim().max(100, 'At most 100 characters'),
      notes: z.string().trim().max(1000, 'Notes must be at most 1000 characters'),
      lines: z.array(z.object(receiveWithInvoiceLineShape)).min(1, 'Add at least one line'),
    })
    .superRefine((data, ctx) => requireForeignRate(data, ctx, leCurrencyCode));
}

export type ReceiveWithInvoiceFormValues = z.input<ReturnType<typeof buildReceiveWithInvoiceSchema>>;
export type ReceiveWithInvoiceFormData = z.output<ReturnType<typeof buildReceiveWithInvoiceSchema>>;
