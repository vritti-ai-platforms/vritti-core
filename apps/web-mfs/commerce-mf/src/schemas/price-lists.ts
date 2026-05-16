import type { CreateResponse, TableResponse } from '@vritti/quantum-ui/api-response';
import { z, zodNumericField } from '@vritti/quantum-ui/zod';

const zOptionalNonNegativeInt = z.number().int().nonnegative().optional().catch(undefined);

export const priceListFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  code: z.string().min(1, 'Code is required').max(50, 'Code cannot exceed 50 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  isActive: z.boolean().optional(),
});

export const priceListItemAssignmentSchema = z.object({
  itemVariantId: z.string().min(1, 'Item variant is required'),
  sortOrder: zOptionalNonNegativeInt,
  isVisible: z.boolean().optional(),
  priceOverride: zOptionalNonNegativeInt,
});

export const terminalPriceListAssignmentSchema = z.object({
  priceListId: z.string().min(1, 'Price list is required'),
  priority: zodNumericField({ required: 'Priority is required', min: 0 }),
  isDefault: z.boolean().optional(),
});

export const savePriceListItemsSchema = z.object({
  items: z.array(priceListItemAssignmentSchema),
});

export const saveTerminalPriceListsSchema = z
  .object({
    priceLists: z.array(terminalPriceListAssignmentSchema),
  })
  .superRefine((value, ctx) => {
    const defaultIndices = value.priceLists
      .map((priceList, index) => (priceList.isDefault ? index : -1))
      .filter((i) => i >= 0);
    if (defaultIndices.length > 1) {
      for (const i of defaultIndices) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['priceLists', i, 'isDefault'],
          message: 'Only one default price list can be selected.',
        });
      }
    }
  });

export type PriceListFormData = z.infer<typeof priceListFormSchema>;
export type SavePriceListItemsFormData = z.infer<typeof savePriceListItemsSchema>;
export type SaveTerminalPriceListsFormData = z.infer<typeof saveTerminalPriceListsSchema>;

export interface PriceListData {
  id: string;
  organizationId: string;
  businessUnitId: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  assignedItemsCount: number;
  assignedTerminalsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PriceListItemData {
  priceListId: string;
  itemVariantId: string;
  itemVariantSku: string;
  itemVariantName: string;
  itemId: string;
  itemName: string;
  basePrice: number | null;
  categoryName: string | null;
  sortOrder: number;
  isVisible: boolean;
  priceOverride: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PosTerminalSellableItemData {
  terminalId: string;
  priceListId: string;
  priceListName: string;
  itemVariantId: string;
  itemVariantSku: string;
  itemVariantName: string;
  itemId: string;
  itemName: string;
  basePrice: number | null;
  priceOverride: number | null;
  categoryName: string | null;
  priority: number;
  sortOrder: number;
}

export interface TerminalPriceListData {
  terminalId: string;
  priceListId: string;
  priceListName: string;
  priceListCode: string;
  priority: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PriceListTableResponse = TableResponse<PriceListData>;
export type CreatePriceListResponse = CreateResponse<PriceListData>;

export interface CreatePriceListData {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePriceListData {
  name?: string;
  code?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface SavePriceListItemsData {
  items: Array<{
    itemVariantId: string;
    sortOrder?: number;
    isVisible?: boolean;
    priceOverride?: number | null;
  }>;
}

export interface SaveTerminalPriceListsData {
  priceLists: Array<{
    priceListId: string;
    priority?: number;
    isDefault?: boolean;
  }>;
}
