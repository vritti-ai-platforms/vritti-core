import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddStockAdjustmentLineItemDto {
  @ApiProperty({ description: 'Serial number for the physical unit' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serialNumber: string;
}
