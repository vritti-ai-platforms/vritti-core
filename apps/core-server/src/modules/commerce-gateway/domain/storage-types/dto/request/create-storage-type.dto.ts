import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';
import {
  type StorageCapacityCheck,
  StorageCapacityCheckValues,
} from '../../constants/storage-capacity-check.constants';

export class CreateStorageTypeDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Unique code within the organization', example: 'shelf-small' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @IsCode()
  code: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Display name', example: 'Small shelf' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description:
      'Most weight one location of this type holds, in grams (g), greater than 0 with up to 3 decimals; null = no weight limit',
    type: Number,
    nullable: true,
    example: 25000,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  maxWeight?: number | null;

  @ApiPropertyOptional({
    description:
      'Most volume one location of this type holds, in millilitres (ml), greater than 0 with up to 3 decimals; null = no volume limit',
    type: Number,
    nullable: true,
    example: 60000,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  maxVolume?: number | null;

  @ApiPropertyOptional({
    description:
      'Inside length in millimetres (mm), greater than 0 with up to 3 decimals; null = no fit check on this side',
    type: Number,
    nullable: true,
    example: 600,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  length?: number | null;

  @ApiPropertyOptional({
    description:
      'Inside width in millimetres (mm), greater than 0 with up to 3 decimals; null = no fit check on this side',
    type: Number,
    nullable: true,
    example: 400,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  width?: number | null;

  @ApiPropertyOptional({
    description:
      'Inside height in millimetres (mm), greater than 0 with up to 3 decimals; null = no fit check on this side',
    type: Number,
    nullable: true,
    example: 250,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  height?: number | null;

  @ApiPropertyOptional({
    description:
      'What happens when a putaway would exceed capacity, weight or volume: NONE skips the checks, WARN records a flag and proceeds, BLOCK refuses',
    enum: Object.values(StorageCapacityCheckValues),
    default: StorageCapacityCheckValues.BLOCK,
  })
  @IsOptional()
  @IsIn(Object.values(StorageCapacityCheckValues))
  capacityCheck?: StorageCapacityCheck;

  @ApiPropertyOptional({ description: 'Whether one location may hold different items', default: true })
  @IsOptional()
  @IsBoolean()
  allowMixedItems?: boolean;

  @ApiPropertyOptional({ description: 'Whether one location may hold different batches of an item', default: false })
  @IsOptional()
  @IsBoolean()
  allowMixedBatches?: boolean;

  @ApiPropertyOptional({
    description: 'Whether putaway may add to stock already in a location',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowAdditionToStock?: boolean;

  @ApiPropertyOptional({ description: 'Whether the storage type can be assigned to locations', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
