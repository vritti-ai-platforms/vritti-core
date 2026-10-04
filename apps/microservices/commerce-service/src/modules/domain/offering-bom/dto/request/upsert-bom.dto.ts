import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsUUID, Min, ValidateNested } from 'class-validator';

export class BomLineInput {
  @IsUUID('7')
  inventoryItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;

  @IsUUID('7')
  uomId: string;
}

export class UpsertBomDto {
  @IsUUID('7')
  variantId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BomLineInput)
  lines: BomLineInput[];
}
