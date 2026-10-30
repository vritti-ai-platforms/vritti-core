import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class InventoryItemMrpsSelectQueryDto extends SelectOptionsQueryDto {
  @ValidateIf((query) => !query.inventoryItemId)
  @IsUUID('7')
  variantId?: string;

  @IsOptional()
  @IsCurrencyCode()
  currencyCode?: string;

  @IsOptional()
  @IsUUID('7')
  catalogId?: string;

  @ValidateIf((query) => !query.variantId)
  @IsUUID('7')
  inventoryItemId?: string;

  @IsOptional()
  @IsUUID('7')
  uomId?: string;
}
