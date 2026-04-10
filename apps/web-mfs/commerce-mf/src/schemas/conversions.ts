import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export type ConversionStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ConversionInputData {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  quantity: number;
  wastageQuantity: number;
}

export interface ConversionOutputData {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
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
  quantity: z.string().min(1, 'Quantity is required'),
  wastageQuantity: z.string().optional(),
});

export const createConversionSchema = z.object({
  bomId: z.string().optional(),
  notes: z.string().optional(),
  inputs: z.array(conversionLineSchema).min(1, 'At least one input is required'),
  outputs: z.array(conversionLineSchema).min(1, 'At least one output is required'),
});

export type CreateConversionFormData = z.infer<typeof createConversionSchema>;
