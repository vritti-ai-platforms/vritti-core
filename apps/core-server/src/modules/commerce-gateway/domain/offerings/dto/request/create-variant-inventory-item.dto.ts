import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateVariantInventoryItemDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Item name', example: 'Onion Garlic 62g' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: ['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'] })
  @IsEnum(['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'])
  type: string;

  @ApiProperty({ enum: ['quantity', 'lot', 'lot_serial', 'serial'] })
  @IsEnum(['quantity', 'lot', 'lot_serial', 'serial'])
  tracking: string;

  @ApiPropertyOptional({ enum: ['none', 'fifo', 'fefo'] })
  @IsEnum(['none', 'fifo', 'fefo'])
  @IsOptional()
  pickStrategy?: string;

  @ApiProperty({ description: 'Category identifier' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ description: 'Stocking unit of measure' })
  @IsUUID()
  uomId: string;

  @Trim()
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'HSN code for tax reporting', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string | null;
}
