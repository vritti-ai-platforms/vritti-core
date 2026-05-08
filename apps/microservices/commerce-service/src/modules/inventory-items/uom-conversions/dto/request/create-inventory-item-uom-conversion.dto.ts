import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateInventoryItemUomConversionDto {
  @IsUUID()
  uomId: string;

  @IsInt()
  @Min(1)
  numerator: number;

  @IsInt()
  @Min(1)
  denominator: number;
}
