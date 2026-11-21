import { ApiProperty } from '@nestjs/swagger';

export class CreatedPurchaseItemResponseDto {
  @ApiProperty({ description: 'The new purchase item' })
  id: string;
}
