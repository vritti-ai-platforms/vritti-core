import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

const ITEM_CODE_PATTERN = /^[A-Z0-9-]+$/;

export class UpdateInventoryItemDto {
  @ApiPropertyOptional({ description: 'Item name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Item code' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(ITEM_CODE_PATTERN, {
    message: 'code must contain only uppercase letters, numbers, and hyphen (-).',
  })
  code?: string;

  @ApiPropertyOptional({
    description: 'Item type',
    enum: ['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'],
  })
  @IsOptional()
  @IsEnum(['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'])
  type?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ description: 'Unit of measure ID' })
  @IsOptional()
  @IsUUID()
  uomId?: string;

  @ApiPropertyOptional({
    description: 'Pick strategy for lot/serial tracked items',
    enum: ['none', 'fifo', 'fefo'],
    default: 'none',
  })
  @IsOptional()
  @IsEnum(['none', 'fifo', 'fefo'])
  pickStrategy?: 'none' | 'fifo' | 'fefo';

  @ApiProperty({ description: 'Purchase tax group ID' })
  @IsUUID()
  purchaseTaxGroupId: string;

  @ApiPropertyOptional({ description: 'HSN code for tax reporting', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string | null;

  @ApiPropertyOptional({ description: 'Whether this item is MRP-governed' })
  @IsOptional()
  @IsBoolean()
  hasMrp?: boolean;

  @ApiPropertyOptional({ description: 'UOM the MRP is quoted in (the pack); required when hasMrp.' })
  @IsOptional()
  @IsUUID()
  mrpUomId?: string;

  @ApiPropertyOptional({ type: CurrencyAmountDto, description: 'Default MRP (site currency)', nullable: true })
  @IsOptional()
  @IsCurrency()
  defaultMrp?: CurrencyAmountDto | null;
}
