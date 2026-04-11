import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateResponse } from '@vritti/quantum-ui/api-response';
import type { Resolver } from 'react-hook-form';
import { z } from 'zod';

const _locationSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100),
	code: z.string().min(1, 'Code is required').max(50),
	isActive: z.boolean(),
	area: z.string().max(100).optional().or(z.literal('')),
	managerId: z.string().max(100).optional().or(z.literal('')),
	address: z.string().max(500).optional().or(z.literal('')),
});

export type LocationFormData = {
	name: string;
	code: string;
	isActive: boolean;
	area: string;
	managerId: string;
	address: string;
};
export const locationFormResolver = zodResolver(_locationSchema) as unknown as Resolver<LocationFormData>;
export type CreateLocationResponse = CreateResponse<StorageLocationData>;

export interface StorageLocationData {
	id: string;
	name: string;
	code: string;
	area: string | null;
	managerId: string | null;
	address: string | null;
	isActive: boolean;
	canDelete: boolean;
	createdAt: string;
}

export interface LocationStockData {
	id: string;
	inventoryItemId: string;
	itemName: string | null;
	itemCode: string | null;
	uomSymbol: string | null;
	stockedQuantity: number;
	reservedQuantity: number;
	availableQuantity: number;
	reorderLevel: number;
}

export type UpdateLocationData = Partial<Pick<LocationFormData, 'name' | 'code' | 'isActive' | 'area' | 'managerId' | 'address'>>;
