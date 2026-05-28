import { z, zodCurrencyField } from '@vritti/quantum-ui/zod';

export const DISTRIBUTION_METHODS = ['by_value', 'by_quantity', 'equal'] as const;
export type DistributionMethod = (typeof DISTRIBUTION_METHODS)[number];

export const DISTRIBUTION_OPTIONS: { value: DistributionMethod; label: string; description?: string }[] = [
  {
    value: 'by_value',
    label: 'By Value',
    description: 'Spread proportionally to each quant’s current cost × quantity. Defaults to by-quantity when nothing is costed yet.',
  },
  {
    value: 'by_quantity',
    label: 'By Quantity',
    description: 'Spread proportionally to each quant’s primary-UOM quantity.',
  },
  { value: 'equal', label: 'Equal', description: 'Split evenly across every quant.' },
];

export const associateCostSchema = z.object({
  categoryId: z.string().uuid('Cost category is required'),
  totalAmount: zodCurrencyField({ required: 'Amount is required', positive: true }),
  distributionMethod: z.enum(DISTRIBUTION_METHODS),
  vendorRef: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateCostSchema = z.object({
  totalAmount: zodCurrencyField({ required: 'Amount is required', positive: true }),
  distributionMethod: z.enum(DISTRIBUTION_METHODS),
  vendorRef: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export type AssociateCostFormData = z.infer<typeof associateCostSchema>;
export type UpdateCostFormData = z.infer<typeof updateCostSchema>;

export interface CostRowData {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryKind: 'ITEM' | 'FREIGHT' | 'DUTY' | 'INSURANCE' | 'SERVICE' | 'OTHER';
  totalAmount: { currency: string; value: string };
  distributionMethod: DistributionMethod;
  vendorRef: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  isLocked: boolean;
}

export interface KindBreakdownEntry {
  kind: 'ITEM' | 'FREIGHT' | 'DUTY' | 'INSURANCE' | 'SERVICE' | 'OTHER';
  amount: { currency: string; value: string };
  percentage: number;
}

export interface GoodsReceiptCostsData {
  costAssociatedAt: string | null;
  totalAmount: { currency: string; value: string };
  perUnitCost: { currency: string; value: string };
  kindBreakdown: KindBreakdownEntry[];
  costRows: { result: CostRowData[]; count: number };
}

export interface CostAllocationData {
  quantId: string;
  locationId: string;
  locationName: string | null;
  lotId: string | null;
  lotNumber: string | null;
  quantity: number;
  allocatedAmount: { currency: string; value: string };
}
