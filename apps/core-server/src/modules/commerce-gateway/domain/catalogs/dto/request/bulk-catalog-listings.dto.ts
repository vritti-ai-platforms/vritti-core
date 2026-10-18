import { ApiProperty } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { ArrayNotEmpty, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class BulkRemoveCatalogListingsDto {
  @ApiProperty({ type: [String], description: 'Refused outright unless every one of them is still in this catalog' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  ids: string[];
}

export class BulkSetCatalogListingPriceDto {
  @ApiProperty({ type: [String], description: 'Refused outright unless every one of them is still in this catalog' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  ids: string[];

  @ApiProperty({ type: CurrencyAmountDto, description: 'One price for all of them, in a currency the catalog carries' })
  @IsCurrency()
  price: CurrencyAmountDto;
}

export class BulkSetCatalogListingAvailabilityDto {
  @ApiProperty({ type: [String], description: 'Refused outright unless every one of them is still in this catalog' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  ids: string[];

  @ApiProperty({ type: [String], description: 'The channels to show or hide them on; all must be owned here' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  channelIds: string[];

  @ApiProperty({ description: 'False excludes every selected listing from every named channel' })
  @IsBoolean()
  visible: boolean;
}
