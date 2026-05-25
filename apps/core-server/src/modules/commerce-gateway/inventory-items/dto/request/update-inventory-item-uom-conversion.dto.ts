import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateInventoryItemUomConversionDto {
  @ApiProperty({ description: 'Count of the item primary UOM in the ratio. 1 Strip = 14 Each → primaryUomQty=14.', example: 14 })
  @IsInt()
  @Min(1)
  primaryUomQty: number;

  @ApiProperty({ description: 'Count of the alternative UOM in the ratio. 1 Strip = 14 Each → uomQty=1.', example: 1 })
  @IsInt()
  @Min(1)
  uomQty: number;
}
