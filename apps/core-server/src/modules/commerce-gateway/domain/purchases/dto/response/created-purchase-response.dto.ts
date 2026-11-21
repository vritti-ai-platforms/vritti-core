import { ApiProperty } from '@nestjs/swagger';

export class CreatedPurchaseResponseDto {
  @ApiProperty({ description: 'The new purchase' })
  id: string;

  @ApiProperty({ description: 'Its number, e.g. PUR-202611-0042', example: 'PUR-202611-0042' })
  purchaseNumber: string;
}
