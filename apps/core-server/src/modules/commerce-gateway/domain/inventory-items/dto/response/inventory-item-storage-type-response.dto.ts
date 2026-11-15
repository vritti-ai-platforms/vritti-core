import { ApiProperty } from '@nestjs/swagger';

export class InventoryItemStorageTypeResponseDto {
  @ApiProperty({ description: 'Item × storage type row ID' })
  id: string;

  @ApiProperty({ description: 'Storage type the item may be stored in' })
  storageTypeId: string;

  @ApiProperty({ description: 'Storage type name', example: 'Small shelf' })
  storageTypeName: string;

  @ApiProperty({ description: 'Most of the item one location of this type holds, counted in `uomId`', example: 7 })
  maxQuantity: number;

  @ApiProperty({ description: 'Unit `maxQuantity` is counted in' })
  uomId: string;

  @ApiProperty({ description: 'Symbol of the unit `maxQuantity` is counted in', example: 'box' })
  uomSymbol: string;
}
