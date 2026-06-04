import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from '@vritti/quantum-ui/zod';

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
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must be at most 50 characters')
    .regex(/^[A-Z0-9_]+$/, 'Use uppercase letters, digits, and underscores only'),
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
