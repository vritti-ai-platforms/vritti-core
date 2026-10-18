import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

export class InventoryItemMrpsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiProperty({ description: 'Variant whose bill of materials decides which printed MRPs are offered' })
  @IsUUID('7')
  variantId: string;

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
}
