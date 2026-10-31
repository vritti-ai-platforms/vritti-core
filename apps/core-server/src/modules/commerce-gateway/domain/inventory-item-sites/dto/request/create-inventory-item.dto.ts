import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSiteInventoryItemDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Item name', example: 'Basmati Rice' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Item SKU', example: 'raw-rice-bas' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsCode()
  sku: string;

  @ApiProperty({
    description: 'Item type',
    enum: ['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'],
  })
  @IsEnum(['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'])
  type: string;

  @ApiProperty({
    description: 'Tracking type — granularity at which stock for this item is identified.',
    enum: ['QUANTITY', 'LOT', 'LOT_SERIAL', 'SERIAL'],
    example: 'LOT',
  })
  @IsEnum(['QUANTITY', 'LOT', 'LOT_SERIAL', 'SERIAL'])
  tracking: 'QUANTITY' | 'LOT' | 'LOT_SERIAL' | 'SERIAL';

  @ApiPropertyOptional({
    description: 'Pick strategy for lot/serial tracked items',
    enum: ['NONE', 'FIFO', 'FEFO'],
    default: 'NONE',
  })
  @IsOptional()
  @IsEnum(['NONE', 'FIFO', 'FEFO'])
  pickStrategy?: 'NONE' | 'FIFO' | 'FEFO';

  @ApiProperty({ description: 'Category ID' })
  @IsUUID('7')
  categoryId: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiProperty({ description: 'Unit of measure ID' })
  @IsUUID('7')
  uomId: string;

  @ApiProperty({ description: 'Tax class the goods are bought under' })
  @IsUUID('7')
  taxClassId: string;

  @Trim()
  @ApiPropertyOptional({ description: 'HSN sku for tax reporting' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string | null;

  @ApiPropertyOptional({ type: CurrencyAmountDto, description: 'Default MRP (site currency)', nullable: true })
  @IsOptional()
  @IsCurrency()
  defaultMrp?: CurrencyAmountDto | null;
}
