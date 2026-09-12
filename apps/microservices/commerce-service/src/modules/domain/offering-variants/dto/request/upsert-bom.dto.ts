import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsUUID, Min, ValidateNested } from 'class-validator';

export class BomLineInput {
  @IsUUID()
  inventoryItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;

  @IsUUID()
  uomId: string;
}

export class UpsertBomDto {
  @IsUUID()
  variantId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BomLineInput)
  lines: BomLineInput[];
}
