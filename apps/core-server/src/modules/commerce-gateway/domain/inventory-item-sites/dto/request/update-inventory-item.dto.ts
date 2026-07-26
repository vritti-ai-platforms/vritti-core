import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateSiteInventoryItemDto {
  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'Item name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'Item code' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @IsCode()
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

  @Trim()
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

  @Trim()
  @ApiPropertyOptional({ description: 'HSN code for tax reporting', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string | null;

  @ApiPropertyOptional({ type: CurrencyAmountDto, description: 'Default MRP (site currency)', nullable: true })
  @IsOptional()
  @IsCurrency()
  defaultMrp?: CurrencyAmountDto | null;
}
