import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, TableResponseDto, type TableViewState } from '@vritti/api-sdk';

export class InventoryItemSupplierResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() supplierId: string;
  @ApiProperty({ nullable: true }) supplierName: string | null;
  @ApiProperty({ nullable: true }) supplierCode: string | null;
  @ApiProperty({ nullable: true }) supplierItemCode: string | null;
  @ApiProperty({ type: CurrencyAmountDto, nullable: true }) unitPrice: CurrencyAmountDto | null;
  @ApiProperty() uomId: string;
  @ApiProperty() uomSymbol: string;
  @ApiProperty({ nullable: true }) minOrderQuantity: number | null;
  @ApiProperty({ nullable: true }) leadTimeDays: number | null;
  @ApiProperty() isPreferred: boolean;
  @ApiProperty() isActive: boolean;
}

export class InventoryItemSupplierTableResponseDto extends TableResponseDto<InventoryItemSupplierResponseDto> {
  @ApiProperty({ type: [InventoryItemSupplierResponseDto] })
  declare result: InventoryItemSupplierResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
