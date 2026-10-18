import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

export class InventoryItemMrpsSelectQueryDto extends SelectOptionsQueryDto {
  @IsUUID('7')
  variantId: string;

  @IsOptional()
  @IsCurrencyCode()
  currencyCode?: string;

  @IsOptional()
  @IsUUID('7')
  catalogId?: string;
}
