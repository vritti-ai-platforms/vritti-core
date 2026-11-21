import { ApiProperty } from '@nestjs/swagger';

export class CreatedPurchaseAllocationResponseDto {
  @ApiProperty({ description: 'The new allocation' })
  id: string;
}
