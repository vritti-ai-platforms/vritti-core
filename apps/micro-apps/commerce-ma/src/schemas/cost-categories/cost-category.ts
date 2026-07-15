import { z, zodCodeField } from '@vritti/quantum-ui-native/zod';
import type { CostCategoryKind } from '../../types/cost-categories';

// The fixed `kind` enum + display copy (mirrors the web COST_CATEGORY_KIND_OPTIONS) for the create-form
// RadioGroup. `kind` and `code` are immutable after create (edit renames only).
export const COST_CATEGORY_KIND_OPTIONS: { value: CostCategoryKind; label: string; description: string }[] = [
  { value: 'ITEM', label: 'Item', description: 'The item cost itself (one per organization)' },
  { value: 'FREIGHT', label: 'Freight', description: 'Shipping and transport charges' },
  { value: 'DUTY', label: 'Duty', description: 'Customs duties and import taxes' },
  { value: 'INSURANCE', label: 'Insurance', description: 'Insurance premiums on goods' },
  { value: 'SERVICE', label: 'Service', description: 'Service and handling fees' },
  { value: 'OTHER', label: 'Other', description: 'Any other landed-cost component' },
];

const KIND_VALUES = COST_CATEGORY_KIND_OPTIONS.map((o) => o.value) as [CostCategoryKind, ...CostCategoryKind[]];

// Create schema: code (unique per org — 409 surfaces on submit), name, and the fixed kind.
// Edit renames only, so it reuses `name` from here.
export const costCategorySchema = z.object({
  code: zodCodeField({ max: 50 }),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or fewer'),
  kind: z.enum(KIND_VALUES),
});

export type CostCategoryFormValues = z.infer<typeof costCategorySchema>;
