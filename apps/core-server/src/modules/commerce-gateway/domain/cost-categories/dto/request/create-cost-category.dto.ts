import { ApiProperty } from '@nestjs/swagger';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export const COST_CATEGORY_KINDS = ['ITEM', 'FREIGHT', 'DUTY', 'INSURANCE', 'SERVICE', 'OTHER'] as const;
export type CostCategoryKind = (typeof COST_CATEGORY_KINDS)[number];

export class CreateCostCategoryDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Unique code within the org', example: 'supplier-price' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code: string;

  @Trim({ nullify: false })
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
