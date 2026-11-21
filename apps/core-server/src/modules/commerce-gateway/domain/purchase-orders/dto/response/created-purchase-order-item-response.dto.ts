import { ApiProperty } from '@nestjs/swagger';

export class CreatedPurchaseOrderItemResponseDto {
  @ApiProperty({ description: 'The new purchase order line' })
  id: string;
}
