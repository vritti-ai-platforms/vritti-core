import { ApiProperty } from '@nestjs/swagger';

export class SiteInventoryItemUomConversionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() uomId: string;
  @ApiProperty() uomName: string;
  @ApiProperty() uomSymbol: string;
  @ApiProperty({ description: 'Count of the item primary UOM in the ratio.' }) primaryUomQty: number;
  @ApiProperty({ description: 'Count of this UOM in the ratio.' }) uomQty: number;
  @ApiProperty({ description: 'Derived: 1 UOM unit = factor primary units.' }) toPrimaryConversionFactor: number;
  @ApiProperty({ description: 'Derived: 1 primary unit = factor UOM units.' }) toUomConversionFactor: number;
  @ApiProperty() canEdit: boolean;
  @ApiProperty() canDelete: boolean;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
