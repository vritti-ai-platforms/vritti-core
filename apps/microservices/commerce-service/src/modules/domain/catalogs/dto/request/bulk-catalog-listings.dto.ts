import { CurrencyAmountDto, IsCurrency, IsCurrencyCode } from '@vritti/api-sdk/money';
import { ArrayNotEmpty, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class BulkRemoveCatalogListingsDto {
  @IsUUID('7')
  catalogId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  ids: string[];
}

export class BulkSetCatalogListingPriceDto {
  @IsUUID('7')
  catalogId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  ids: string[];

  @IsCurrency()
  price: CurrencyAmountDto;
}

export class BulkClearCatalogListingPricesDto {
  @IsUUID('7')
  catalogId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  ids: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsCurrencyCode({ each: true })
  currencyCodes: string[];
}

export class BulkSetCatalogListingAvailabilityDto {
  @IsUUID('7')
  catalogId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  ids: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  channelIds: string[];

  @IsBoolean()
  visible: boolean;
}
