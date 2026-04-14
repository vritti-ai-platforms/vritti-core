import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateResponse } from '@vritti/quantum-ui/api-response';
import type { Resolver } from 'react-hook-form';
import { z } from 'zod';

const _locationSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100),
	code: z.string().min(1, 'Code is required').max(50),
	parentId: z.string().optional().nullable(),
	sortOrder: z.coerce.number().int().min(1, 'Sort order must be at least 1'),
	isActive: z.boolean(),
	area: z.string().max(100).optional().or(z.literal('')),
	managerId: z.string().max(100).optional().or(z.literal('')),
	address: z.string().max(500).optional().or(z.literal('')),
});

export type LocationFormData = {
	name: string;
	code: string;
	parentId?: string | null;
	sortOrder: number;
	isActive: boolean;
	area: string;
	managerId: string;
	address: string;
};
export const locationFormResolver = zodResolver(_locationSchema) as unknown as Resolver<LocationFormData>;
export type CreateLocationResponse = CreateResponse<StorageLocationData>;

export interface StorageLocationData {
	id: string;
	organizationId: string;
	businessUnitId: string;
	name: string;
	code: string;
	parentId: string | null;
	sortOrder: number;
	area: string | null;
	managerId: string | null;
	address: string | null;
	isActive: boolean;
	canDelete: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface StorageLocationTreeNode {
	id: string;
	name: string;
	children?: StorageLocationTreeNode[];
}

export interface StorageLocationCountData {
	count: number;
}

export type StorageLocationChildrenTableResponse = TableResponse<StorageLocationData>;

export interface ReorderLocationsData {
	parentId: string | null;
	orderedIds: string[];
}

export type UpdateLocationData = Partial<
	Pick<LocationFormData, 'name' | 'code' | 'parentId' | 'sortOrder' | 'isActive' | 'area' | 'managerId' | 'address'>
>;
