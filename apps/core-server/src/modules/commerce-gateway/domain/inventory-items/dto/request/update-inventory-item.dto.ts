import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateInventoryItemDto {
  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'Item name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'Item SKU' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @IsCode()
  sku?: string;

  @ApiPropertyOptional({
    description: 'Item type',
    enum: ['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'],
  })
  @IsOptional()
  @IsEnum(['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'])
  type?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsUUID('7')
  categoryId?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ description: 'Unit of measure ID' })
  @IsOptional()
  @IsUUID('7')
  uomId?: string;

  @ApiPropertyOptional({ description: 'Unit the item is displayed in — its primary unit or one it converts to' })
  @IsOptional()
  @IsUUID('7')
  displayUomId?: string;

  @ApiPropertyOptional({
    description: 'Pick strategy for lot/serial tracked items',
    enum: ['NONE', 'FIFO', 'FEFO'],
    default: 'NONE',
  })
  @IsOptional()
  @IsEnum(['NONE', 'FIFO', 'FEFO'])
  pickStrategy?: 'NONE' | 'FIFO' | 'FEFO';

  @Trim()
  @ApiPropertyOptional({ description: 'HSN code for tax reporting', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string | null;

  @ApiPropertyOptional({ description: 'Tax class the goods are bought under' })
  @IsOptional()
  @IsUUID('7')
  taxClassId?: string;

  @ApiPropertyOptional({
    description: 'Weight of one primary unit, in grams (g), greater than 0 with up to 3 decimals; null clears it',
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  weight?: number | null;

  @ApiPropertyOptional({
    description:
      'Volume of one primary unit, in millilitres (ml), greater than 0 with up to 3 decimals; null clears it',
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  volume?: number | null;

  @ApiPropertyOptional({
    description:
      'Length of one primary unit, in millimetres (mm), greater than 0 with up to 3 decimals; null clears it',
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  length?: number | null;

  @ApiPropertyOptional({
    description: 'Width of one primary unit, in millimetres (mm), greater than 0 with up to 3 decimals; null clears it',
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  width?: number | null;

  @ApiPropertyOptional({
    description:
      'Height of one primary unit, in millimetres (mm), greater than 0 with up to 3 decimals; null clears it',
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  height?: number | null;
}
