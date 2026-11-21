import { ApiProperty } from '@nestjs/swagger';

export class CartCountsResponseDto {
  @ApiProperty({ description: 'Lines in the cart', example: 3 })
  itemCount: number;
}
