import { ApiProperty } from '@nestjs/swagger';

export class CreatedLegPurchaseOrdersResponseDto {
  @ApiProperty({
    type: [String],
    description: "The purchase orders created, one per currency of the leg's allocations",
  })
  purchaseOrderIds: string[];
}
