import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class InventoryItemMrpsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({ description: 'Variant whose bill of materials decides which printed MRPs are offered' })
  @ValidateIf((query) => !query.inventoryItemId)
  @IsUUID('7')
  variantId?: string;

  @ApiPropertyOptional({
    description: 'Only the MRPs printed in this currency, which is what a listing may be priced in',
  })
  @IsOptional()
  @IsCurrencyCode()
  currencyCode?: string;

  @ApiPropertyOptional({ description: 'Hide the MRPs this catalog already lists this variant at' })
  @IsOptional()
  @IsUUID('7')
  catalogId?: string;

  @ApiPropertyOptional({ description: 'Inventory item whose MRPs to list (instead of a variant)' })
  @ValidateIf((query) => !query.variantId)
  @IsUUID('7')
  inventoryItemId?: string;

  @ApiPropertyOptional({ description: 'Unit the MRP is printed for' })
  @IsOptional()
  @IsUUID('7')
  uomId?: string;
}
