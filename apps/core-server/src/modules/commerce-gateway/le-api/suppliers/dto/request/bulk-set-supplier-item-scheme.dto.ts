import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsBoolean, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class BulkSetSupplierItemSchemeDto {
  @ApiProperty({ type: [String], description: 'Supplier item IDs to apply the scheme to.' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  supplierItemIds: string[];

  @ApiPropertyOptional({ description: 'Free-goods scheme buy qty (e.g. 9 in "9+1").' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number;

  @ApiPropertyOptional({ description: 'Free-goods scheme free qty (e.g. 1 in "9+1").' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number;

  @ApiProperty({ description: 'Whether a free-goods scheme applies.' })
  @IsBoolean()
  hasScheme: boolean;
}
