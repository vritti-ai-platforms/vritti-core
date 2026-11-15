import { Trim } from '@vritti/api-sdk/decorators';
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Matches } from 'class-validator';

export class PurchaseItemFieldsDto {
  @IsUUID('7')
  inventoryItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  primaryQty: number;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'neededBy must be YYYY-MM-DD' })
  neededBy?: string;

  @Trim()
  @IsOptional()
  @IsString()
  notes?: string | null;
}
