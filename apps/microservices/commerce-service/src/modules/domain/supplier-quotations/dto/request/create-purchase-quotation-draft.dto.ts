import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsNotEmpty, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';

export class PurchaseQuotationDraftLineDto {
  @IsUUID('7')
  purchaseItemId: string;

  @IsUUID('7')
  inventoryItemId: string;

  @IsUUID('7')
  uomId: string;
}

export class CreatePurchaseQuotationDraftDto {
  @IsUUID('7')
  purchaseId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  purchaseNumber: string;

  @IsUUID('7')
  supplierId: string;

  @IsCurrencyCode()
  currencyCode: string;

  @IsDateString()
  validFrom: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseQuotationDraftLineDto)
  lines: PurchaseQuotationDraftLineDto[];
}
