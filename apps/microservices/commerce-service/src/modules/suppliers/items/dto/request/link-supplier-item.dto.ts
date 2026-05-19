import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class LinkSupplierItemDto {
  @IsUUID()
  inventoryItemId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierItemCode?: string;

  @IsCurrency()
  unitPrice: CurrencyAmountDto;

  @IsUUID()
  @IsNotEmpty()
  uomId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;
}
