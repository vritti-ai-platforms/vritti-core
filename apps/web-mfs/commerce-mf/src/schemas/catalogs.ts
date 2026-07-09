import type { CreateResponse, TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

export const catalogFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  taxInclusive: z.boolean().optional(),
  isActive: z.boolean().optional(),
  channelIds: z.array(z.string()).optional(),
});

export type CatalogFormData = z.infer<typeof catalogFormSchema>;

export interface CatalogData {
  id: string;
  organizationId: string;
  businessUnitId: string;
  channelCount: number;
  name: string;
  currencyCode: string;
  taxInclusive: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogChannel {
  id: string;
  catalogId: string;
  businessUnitId: string;
  channelId: string;
  channelName: string;
  channelKind: string;
}

export type CatalogTableResponse = TableResponse<CatalogData>;
export type CreateCatalogResponse = CreateResponse<CatalogData>;

export interface CreateCatalogData {
  name: string;
  taxInclusive?: boolean;
  isActive?: boolean;
  channelIds?: string[];
}

export interface UpdateCatalogData {
  name?: string;
  taxInclusive?: boolean;
  isActive?: boolean;
  channelIds?: string[];
}
