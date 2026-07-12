import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export const COST_CATEGORY_KINDS = ['ITEM', 'FREIGHT', 'DUTY', 'INSURANCE', 'SERVICE', 'OTHER'] as const;
export type CostCategoryKind = (typeof COST_CATEGORY_KINDS)[number];

export class CreateCostCategoryDto {
  @ApiProperty({ description: 'Unique code within the org', example: 'SUPPLIER_PRICE' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Human-readable name', example: 'Supplier Price' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Reporting kind — fixed enum used for cross-org rollups',
    enum: COST_CATEGORY_KINDS,
  })
  @IsEnum(COST_CATEGORY_KINDS)
  kind: CostCategoryKind;
}
