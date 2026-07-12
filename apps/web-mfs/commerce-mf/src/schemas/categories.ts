import type { CreateResponse, SuccessResponse, TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodNumericField, zodResolver } from '@vritti/quantum-ui/zod';
import type { Resolver } from 'react-hook-form';
import type { InventoryItemType, InventoryTracking } from '@/schemas/inventory-items';

// GROUP holds sub-categories; CATEGORY is a leaf that holds inventory items.
export const CategoryRoleValues = {
  GROUP: 'GROUP',
  CATEGORY: 'CATEGORY',
} as const;
export type CategoryRole = (typeof CategoryRoleValues)[keyof typeof CategoryRoleValues];

export const CategoryRoleLabels: Record<CategoryRole, string> = {
  GROUP: 'Group',
  CATEGORY: 'Category',
};

const categoryRoleEnumValues = Object.values(CategoryRoleValues) as [CategoryRole, ...CategoryRole[]];

const _categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  parentId: z.string().optional().nullable(),
  categoryRole: z.enum(categoryRoleEnumValues),
  sortOrder: zodNumericField({ required: 'Sort order is required', min: 1 }),
  isActive: z.boolean(),
  defaultTaxGroupId: z.string().optional().nullable(),
});

// TypeScript form type — sortOrder is number for defaultValues, mutation, and form logic
export type CategoryFormData = {
  name: string;
  parentId?: string | null;
  categoryRole: CategoryRole;
  sortOrder: number;
  isActive: boolean;
  defaultTaxGroupId?: string | null;
};

// Pre-typed resolver — casts once here so no `as any` leaks into components
export const categoryFormResolver = zodResolver(_categorySchema) as unknown as Resolver<CategoryFormData>;

export interface CategoryData {
  id: string;
  siteId: string;
  name: string;
  parentId: string | null;
  categoryRole: CategoryRole;
  pathLabel: string;
  path: string;
  sortOrder: number;
  isActive: boolean;
  canDelete: boolean;
  defaultTaxGroupId: string | null;
  createdAt: string;
}

// One inventory item row shown under a leaf (CATEGORY-role) category.
export interface CategoryItemRow {
  id: string;
  name: string;
  code: string;
  type: InventoryItemType;
  tracking: InventoryTracking;
  uomSymbol: string | null;
}

export type CategoryItemsTableResponse = TableResponse<CategoryItemRow>;

export interface CategoryTreeNode {
  id: string;
  name: string;
  categoryRole: CategoryRole;
  children?: CategoryTreeNode[];
}

export interface CategoryCountData {
  count: number;
}

export interface ReorderCategoriesData {
  parentId: string | null;
  orderedIds: string[];
}

export type CategoryChildrenTableResponse = TableResponse<CategoryData>;

export type CategoryCreateResponse = CreateResponse<CategoryData>;
export type { SuccessResponse };
