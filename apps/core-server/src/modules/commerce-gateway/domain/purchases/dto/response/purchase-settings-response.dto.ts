import { ApiProperty } from '@nestjs/swagger';

export class PurchaseSettingsResponseDto {
  @ApiProperty()
  siteId: string;

  @ApiProperty({ description: 'The site buys an item only from suppliers that have it set up there' })
  supplierItemsRequired: boolean;

  @ApiProperty({
    description: 'A sent purchase order sets up the supplier items it orders at the site, with its price',
  })
  updateSupplierItemsFromOrders: boolean;
}

export class PurchaseSettingsRowResponseDto extends PurchaseSettingsResponseDto {
  @ApiProperty()
  siteName: string;

  @ApiProperty()
  siteCode: string;
}
