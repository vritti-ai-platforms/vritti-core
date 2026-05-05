import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateInventoryItemUomConversionDto {
  @ApiProperty({ description: 'Updated per-item conversion factor' })
  @IsNumber()
  @Min(0.0000001)
  conversionFactor: number;
}
