import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BomResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class BomLineResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  inventoryItemId: string;

  @ApiPropertyOptional({ nullable: true })
  inventoryItemName: string | null;

  @ApiProperty()
  requiredQuantity: number;
}

export class BomDetailResponseDto extends BomResponseDto {
  @ApiProperty({ type: [BomLineResponseDto] })
  lines: BomLineResponseDto[];
}
