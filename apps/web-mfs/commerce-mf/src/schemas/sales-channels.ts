import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCodeField } from '@vritti/quantum-ui/zod';

export const SALES_CHANNEL_KIND_VALUES = ['IN_STORE', 'ONLINE', 'ZOMATO', 'SWIGGY', 'OTHER'] as const;
export type SalesChannelKind = (typeof SALES_CHANNEL_KIND_VALUES)[number];

export const SALES_CHANNEL_KIND_OPTIONS: { value: SalesChannelKind; label: string; description?: string }[] = [
  { value: 'IN_STORE', label: 'In-Store', description: 'Physical counter / POS sales' },
  { value: 'ONLINE', label: 'Online', description: 'Own web / app storefront' },
  { value: 'ZOMATO', label: 'Zomato', description: 'Zomato aggregator integration' },
  { value: 'SWIGGY', label: 'Swiggy', description: 'Swiggy aggregator integration' },
  { value: 'OTHER', label: 'Other', description: 'Any other channel' },
];

const kindSchema = z.enum(SALES_CHANNEL_KIND_VALUES);

export const createSalesChannelSchema = z.object({
  code: zodCodeField({ max: 50 }),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
  kind: kindSchema,
});

export const updateSalesChannelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  isActive: z.boolean().optional(),
});

export type CreateSalesChannelFormData = z.infer<typeof createSalesChannelSchema>;
export type UpdateSalesChannelFormData = z.infer<typeof updateSalesChannelSchema>;

export interface SalesChannelData {
  id: string;
  code: string;
  name: string;
  kind: SalesChannelKind;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SalesChannelsTableResponse = TableResponse<SalesChannelData>;
