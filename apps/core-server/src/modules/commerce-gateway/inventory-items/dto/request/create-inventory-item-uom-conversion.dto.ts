import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateInventoryItemUomConversionDto {
  @ApiProperty({ description: 'ID of the alternative UOM' })
  @IsUUID()
  uomId: string;

  @ApiProperty({
    description: 'Numerator: count of the alternative UOM in the ratio (e.g. 100 in "100 ml = 1 vial")',
    example: 1,
  })
  @IsInt()
  @Min(1)
  numerator: number;

  @ApiProperty({
    description: 'Denominator: count of the item primary UOM in the ratio (e.g. 1 in "100 ml = 1 vial")',
    example: 10,
  })
  @IsInt()
  @Min(1)
  denominator: number;
}
