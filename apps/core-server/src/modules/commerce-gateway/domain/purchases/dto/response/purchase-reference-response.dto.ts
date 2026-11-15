import { ApiProperty } from '@nestjs/swagger';

export class PurchaseReferenceResponseDto {
  @ApiProperty({ description: 'Purchase ID' })
  id: string;

  @ApiProperty({ description: 'Purchase number', example: 'PUR-202611-0001' })
  purchaseNumber: string;
}
