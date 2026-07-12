export class CreateCostCategoryDto {
  code: string;
  name: string;
  kind: 'ITEM' | 'FREIGHT' | 'DUTY' | 'INSURANCE' | 'SERVICE' | 'OTHER';
}
