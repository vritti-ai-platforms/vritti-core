import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiProperty({ enum: ['MATERIAL', 'PRODUCT'] })
  type: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  uomId: string;

  @ApiPropertyOptional({ nullable: true })
  uomSymbol: string | null;

  @ApiProperty()
  requiresShipping: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
