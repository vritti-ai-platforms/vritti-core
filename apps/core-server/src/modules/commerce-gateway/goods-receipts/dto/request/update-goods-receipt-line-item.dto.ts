import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateGoodsReceiptLineItemDto {
  @ApiProperty({ description: 'Serial number registered against this line.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serialNumber: string;
}
