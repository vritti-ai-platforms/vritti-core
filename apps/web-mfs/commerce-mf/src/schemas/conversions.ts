import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z, zodNumericField } from '@vritti/quantum-ui/zod';

export type ConversionStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ConversionInputData {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  quantity: number;
  wastageQuantity: number;
}

export interface ConversionOutputData {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  quantity: number;
  wastageQuantity: number;
}

export interface ConversionData {
  id: string;
  bomId: string | null;
  bomName: string | null;
  status: ConversionStatus;
  producedBy: string | null;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversionDetail extends ConversionData {
  inputs: ConversionInputData[];
  outputs: ConversionOutputData[];
}

export type ConversionsTableResponse = TableResponse<ConversionData>;

const conversionLineSchema = z.object({
  inventoryItemId: z.string().min(1, 'Item is required'),
  quantity: zodNumericField({ required: 'Quantity is required', positive: true }),
  wastageQuantity: z.number().nonnegative().optional().catch(undefined),
});

export const createConversionSchema = z.object({
  bomId: z.string().optional(),
  locationId: z.string().min(1, 'Location is required'),
  notes: z.string().optional(),
  inputs: z.array(conversionLineSchema).min(1, 'At least one input is required'),
  outputs: z.array(conversionLineSchema).min(1, 'At least one output is required'),
});

export type CreateConversionFormData = z.infer<typeof createConversionSchema>;

export const completeConversionSchema = z.object({
  locationId: z.string().min(1, 'Location is required'),
});

export type CompleteConversionFormData = z.infer<typeof completeConversionSchema>;
