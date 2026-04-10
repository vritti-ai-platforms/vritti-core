import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConversionInputResponseDto {
  @ApiProperty({ description: 'Conversion input ID' })
  id: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiPropertyOptional({ description: 'Inventory item name', nullable: true })
  inventoryItemName: string | null;

  @ApiProperty({ description: 'Quantity consumed' })
  quantity: number;

  @ApiProperty({ description: 'Wastage quantity' })
  wastageQuantity: number;
}

export class ConversionOutputResponseDto {
  @ApiProperty({ description: 'Conversion output ID' })
  id: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiPropertyOptional({ description: 'Inventory item name', nullable: true })
  inventoryItemName: string | null;

  @ApiProperty({ description: 'Quantity produced' })
  quantity: number;

  @ApiProperty({ description: 'Wastage quantity' })
  wastageQuantity: number;
}

export class ConversionResponseDto {
  @ApiProperty({ description: 'Conversion ID' })
  id: string;

  @ApiPropertyOptional({ description: 'BOM template ID', nullable: true })
  bomId: string | null;

  @ApiProperty({ description: 'Conversion status', example: 'DRAFT' })
  status: string;

  @ApiPropertyOptional({ description: 'User who performed the conversion', nullable: true })
  producedBy: string | null;

  @ApiPropertyOptional({ description: 'ISO timestamp when started', nullable: true })
  startedAt: string | null;

  @ApiPropertyOptional({ description: 'ISO timestamp when completed', nullable: true })
  completedAt: string | null;

  @ApiPropertyOptional({ description: 'Additional notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}

export class ConversionDetailResponseDto extends ConversionResponseDto {
  @ApiProperty({ description: 'Input materials', type: [ConversionInputResponseDto] })
  inputs: ConversionInputResponseDto[];

  @ApiProperty({ description: 'Output products', type: [ConversionOutputResponseDto] })
  outputs: ConversionOutputResponseDto[];
}
