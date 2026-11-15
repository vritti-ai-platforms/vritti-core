import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReleaseSupplierInvoiceHoldDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Why the hold is released', example: 'Price agreed with the supplier by phone.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
