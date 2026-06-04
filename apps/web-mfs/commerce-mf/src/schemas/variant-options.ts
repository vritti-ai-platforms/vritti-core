import { z } from '@vritti/quantum-ui/zod';

export const variantOptionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  values: z.array(z.string().min(1)).min(1, 'Add at least one value'),
});

export type VariantOptionFormData = z.infer<typeof variantOptionSchema>;

export interface VariantOptionValue {
  id: string;
  value: string;
  sortOrder: number;
  referenced: boolean;
}

export interface VariantOption {
  id: string;
  name: string;
  sortOrder: number;
  values: VariantOptionValue[];
}

export interface VariantOptionData {
  name?: string;
  values?: string[];
}
