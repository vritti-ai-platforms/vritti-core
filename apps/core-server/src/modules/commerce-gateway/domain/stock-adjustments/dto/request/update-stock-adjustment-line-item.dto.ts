import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateStockAdjustmentLineItemDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Serial number for the physical unit' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serialNumber: string;
}
