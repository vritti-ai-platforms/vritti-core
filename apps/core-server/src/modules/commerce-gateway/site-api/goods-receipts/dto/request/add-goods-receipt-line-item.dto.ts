import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddGoodsReceiptLineItemDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Serial number registered against this line.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serialNumber: string;
}
