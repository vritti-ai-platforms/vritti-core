import { ApiProperty } from '@nestjs/swagger';

export class OrderCountsResponseDto {
  @ApiProperty({ description: 'Items on the order', example: 4 })
  itemCount: number;

  @ApiProperty({
    description: "Payments of the order's checkout, including any second payment being refunded",
    example: 1,
  })
  paymentCount: number;
}
