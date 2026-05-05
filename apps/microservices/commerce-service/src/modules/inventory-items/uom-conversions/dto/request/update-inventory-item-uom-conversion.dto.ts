import { IsNumber, Min } from 'class-validator';

export class UpdateInventoryItemUomConversionDto {
  @IsNumber()
  @Min(0.0000001)
  conversionFactor: number;
}
