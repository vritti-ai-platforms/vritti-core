import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePurchaseSettingsDto {
  @ApiPropertyOptional({
    description: "Buy an item only from suppliers that have it set up at the site (SAP's source list requirement)",
  })
  @IsOptional()
  @IsBoolean()
  supplierItemsRequired?: boolean;

  @ApiPropertyOptional({
    description: 'A sent purchase order sets up the supplier items it orders at the site, with the price it paid',
  })
  @IsOptional()
  @IsBoolean()
  updateSupplierItemsFromOrders?: boolean;
}
