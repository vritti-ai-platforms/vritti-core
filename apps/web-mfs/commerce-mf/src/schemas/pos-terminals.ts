import type { CreateResponse, TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from '@vritti/quantum-ui/zod';

export const posTerminalFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  code: z.string().min(1, 'Code is required').max(50, 'Code cannot exceed 50 characters'),
  locationId: z.string().min(1, 'POS storage location is required'),
  catalogId: z.string().min(1, 'Catalog is required'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  isActive: z.boolean().optional(),
});

export type PosTerminalFormData = z.infer<typeof posTerminalFormSchema>;

export interface PosTerminalData {
  id: string;
  organizationId: string;
  businessUnitId: string;
  name: string;
  code: string;
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  catalogId: string | null;
  catalogName: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PosTerminalTableResponse = TableResponse<PosTerminalData>;
export type CreatePosTerminalResponse = CreateResponse<PosTerminalData>;

export interface CreatePosTerminalData {
  name: string;
  code: string;
  locationId: string;
  catalogId: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePosTerminalData {
  name?: string;
  code?: string;
  locationId?: string;
  catalogId?: string;
  description?: string | null;
  isActive?: boolean;
}
