import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateInventoryItemStorageTypeDto {
  @ApiProperty({ description: 'Storage type the item may be stored in' })
  @IsUUID('7')
  storageTypeId: string;

  @ApiProperty({
    description: 'Most of the item one location of this type holds, counted in `uomId`',
    example: 7,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  maxQuantity: number;

  @ApiProperty({ description: 'Unit `maxQuantity` is counted in — the primary unit or one of its conversions' })
  @IsUUID('7')
  uomId: string;
}
