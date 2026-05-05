import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class CreateInventoryItemUomConversionDto {
  @ApiProperty({ description: 'ID of the derived unit of measure' })
  @IsUUID()
  uomId: string;

  @ApiProperty({ description: 'Per-item conversion factor overriding the global default' })
  @IsNumber()
  @Min(0.0000001)
  conversionFactor: number;
}
