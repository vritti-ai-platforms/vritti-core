import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ConversionLineDto {
  @ApiProperty({ description: 'Inventory item ID' })
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @ApiProperty({ description: 'Quantity', example: 10 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ description: 'Wastage quantity', example: 0.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  wastageQuantity?: number;
}

export class CreateConversionDto {
  @ApiProperty({ description: 'Inventory location ID where the conversion occurs' })
  @IsUUID()
  locationId: string;

  @ApiPropertyOptional({ description: 'BOM template ID' })
  @IsOptional()
  @IsUUID()
  bomId?: string;

  @ApiPropertyOptional({ description: 'Initial status', example: 'DRAFT' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'User ID of the person performing the conversion' })
  @IsOptional()
  @IsUUID()
  producedBy?: string;

  @ApiPropertyOptional({ description: 'ISO timestamp when conversion started' })
  @IsOptional()
  @IsString()
  startedAt?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Input materials', type: [ConversionLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversionLineDto)
  inputs: ConversionLineDto[];

  @ApiProperty({ description: 'Output products', type: [ConversionLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversionLineDto)
  outputs: ConversionLineDto[];
}
