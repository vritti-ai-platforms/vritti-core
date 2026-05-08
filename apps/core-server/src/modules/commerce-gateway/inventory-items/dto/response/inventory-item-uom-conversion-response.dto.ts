import { ApiProperty } from '@nestjs/swagger';

export class InventoryItemUomConversionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() uomId: string;
  @ApiProperty() uomName: string;
  @ApiProperty() uomSymbol: string;
  @ApiProperty() numerator: number;
  @ApiProperty() denominator: number;
  @ApiProperty() canEdit: boolean;
  @ApiProperty() canDelete: boolean;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
