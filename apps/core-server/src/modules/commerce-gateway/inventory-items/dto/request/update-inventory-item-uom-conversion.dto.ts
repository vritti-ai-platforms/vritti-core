import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateInventoryItemUomConversionDto {
  @ApiProperty({ description: 'Numerator: count of the alternative UOM in the ratio', example: 1 })
  @IsInt()
  @Min(1)
  numerator: number;

  @ApiProperty({ description: 'Denominator: count of the item primary UOM in the ratio', example: 10 })
  @IsInt()
  @Min(1)
  denominator: number;
}
