import { ApiProperty } from '@nestjs/swagger';

export class SiteGroupItemAvailabilityResponseDto {
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() itemName: string;
  @ApiProperty() itemSku: string;
  @ApiProperty({ type: [String] }) siteIds: string[];
}
