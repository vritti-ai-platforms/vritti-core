import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateGoodsReceiptBatchItemDto {
  @ApiProperty({ description: 'Serial number for the physical unit' })
  @IsString()
  @MaxLength(100)
  serialNumber: string;
}
