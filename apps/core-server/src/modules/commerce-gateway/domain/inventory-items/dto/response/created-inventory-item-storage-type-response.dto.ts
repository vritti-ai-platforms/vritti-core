import { ApiProperty } from '@nestjs/swagger';

export class CreatedInventoryItemStorageTypeResponseDto {
  @ApiProperty({ description: "The item's new storage type row" })
  id: string;
}
