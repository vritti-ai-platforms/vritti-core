import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

// Each batch item represents one physical unit (tracking='serial' only).
export class AddGoodsReceiptBatchItemDto {
  @ApiProperty({ description: 'Serial number for the physical unit' })
  @IsString()
  @MaxLength(100)
  serialNumber: string;
}
