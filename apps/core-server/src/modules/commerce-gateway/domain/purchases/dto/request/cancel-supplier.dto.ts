import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CANCELLED_QUANTITIES, type CancelledQuantity } from '../../constants/purchase.constants';

export class CancelSupplierDto {
  @ApiProperty({
    description: "What happens to the supplier's quantity: back to allocate, or dropped from the purchase",
    enum: CANCELLED_QUANTITIES,
  })
  @IsIn(CANCELLED_QUANTITIES)
  quantity: CancelledQuantity;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Why the supplier is cancelled', example: 'Out of stock till December.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
