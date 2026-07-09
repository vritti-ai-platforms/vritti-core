// A cost category (mirrors the CostCategory GraphQL type). `kind` is a fixed reporting enum, immutable
// after create; `code` is unique per org, immutable. GraphQL types `kind` as String (enum caveat), so the
// hand union keeps form/badge precision. `canDelete` is false for system rows or rows referenced by cost rows.
export type CostCategoryKind = 'ITEM' | 'FREIGHT' | 'DUTY' | 'INSURANCE' | 'SERVICE' | 'OTHER';

export interface CostCategory {
  id: string;
  code: string;
  name: string;
  kind: CostCategoryKind;
  isActive: boolean;
  isSystem: boolean;
  canDelete: boolean;
}
