import { ApiProperty } from '@nestjs/swagger';

export class InventoryItemUomConversionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() uomId: string;
  @ApiProperty() uomName: string;
  @ApiProperty() uomSymbol: string;
  @ApiProperty({ nullable: true }) baseUomId: string | null;
  @ApiProperty({ nullable: true }) baseUomSymbol: string | null;
  @ApiProperty() defaultConversionFactor: number;
  @ApiProperty() conversionFactor: number;
  @ApiProperty() canEdit: boolean;
  @ApiProperty() canDelete: boolean;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
