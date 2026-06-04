import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

const ITEM_CODE_PATTERN = /^[A-Z0-9-]+$/;

export class CreateInventoryItemDto {
  @ApiProperty({ description: 'Item name', example: 'Basmati Rice' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Item code', example: 'RAW-RICE-BAS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(ITEM_CODE_PATTERN, {
    message: 'code must contain only uppercase letters, numbers, and hyphen (-).',
  })
  code: string;

  @ApiProperty({
    description: 'Item type',
    enum: ['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'],
  })
  @IsEnum(['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'])
  type: string;

  @ApiProperty({
    description: 'Tracking type — granularity at which stock for this item is identified.',
    enum: ['quantity', 'lot', 'lot_serial', 'serial'],
    example: 'lot',
  })
  @IsEnum(['quantity', 'lot', 'lot_serial', 'serial'])
  tracking: 'quantity' | 'lot' | 'lot_serial' | 'serial';

  @ApiPropertyOptional({
    description: 'Pick strategy for lot/serial tracked items',
    enum: ['none', 'fifo', 'fefo'],
    default: 'none',
  })
  @IsOptional()
  @IsEnum(['none', 'fifo', 'fefo'])
  pickStrategy?: 'none' | 'fifo' | 'fefo';

  @ApiProperty({ description: 'Category ID' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Unit of measure ID' })
  @IsUUID()
  uomId: string;

  @ApiPropertyOptional({ description: 'Purchase tax group ID' })
  @IsOptional()
  @IsUUID()
  purchaseTaxGroupId?: string;

  @ApiPropertyOptional({ description: 'HSN code for tax reporting' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string;
}
