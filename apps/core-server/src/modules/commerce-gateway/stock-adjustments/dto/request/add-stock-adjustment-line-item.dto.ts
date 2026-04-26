import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// One physical unit. For OPENING_STOCK + tracking='serial' the serial registers a
// new unit; for deduct flows the same field consumes an existing AVAILABLE unit
// matched by (orgId, itemId, serialNumber) on the line's quant.
export class AddStockAdjustmentLineItemDto {
  @ApiProperty({ description: 'Serial number for the physical unit' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serialNumber: string;
}
