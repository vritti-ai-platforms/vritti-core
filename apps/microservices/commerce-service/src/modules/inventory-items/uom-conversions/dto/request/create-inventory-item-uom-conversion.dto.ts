import { IsNumber, IsUUID, Min } from 'class-validator';

export class CreateInventoryItemUomConversionDto {
  @IsUUID()
  uomId: string;

  @IsNumber()
  @Min(0.0000001)
  conversionFactor: number;
}
