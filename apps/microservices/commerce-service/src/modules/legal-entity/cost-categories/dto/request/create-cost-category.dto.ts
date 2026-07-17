import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export const COST_CATEGORY_KINDS = ['ITEM', 'FREIGHT', 'DUTY', 'INSURANCE', 'SERVICE', 'OTHER'] as const;
export type CostCategoryKind = (typeof COST_CATEGORY_KINDS)[number];

export class CreateCostCategoryDto {
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEnum(COST_CATEGORY_KINDS)
  kind: CostCategoryKind;
}
