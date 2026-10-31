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

  @ApiProperty({ enum: ['QUANTITY', 'LOT', 'LOT_SERIAL', 'SERIAL'] })
  @IsEnum(['QUANTITY', 'LOT', 'LOT_SERIAL', 'SERIAL'])
  tracking: string;

  @ApiPropertyOptional({ enum: ['NONE', 'FIFO', 'FEFO'] })
  @IsEnum(['NONE', 'FIFO', 'FEFO'])
  @IsOptional()
  pickStrategy?: string;

  @ApiProperty({ description: 'Category identifier' })
  @IsUUID('7')
  categoryId: string;

  @ApiProperty({ description: 'Stocking unit of measure' })
  @IsUUID('7')
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
