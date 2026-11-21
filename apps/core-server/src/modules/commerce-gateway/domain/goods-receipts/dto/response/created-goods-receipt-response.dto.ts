import { ApiProperty } from '@nestjs/swagger';

export class CreatedGoodsReceiptResponseDto {
  @ApiProperty({ description: 'The new draft goods receipt' })
  id: string;

  @ApiProperty({ description: 'Its number' })
  grNumber: string;
}
