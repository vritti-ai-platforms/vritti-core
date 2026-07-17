import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateInventoryItemDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Item name', example: 'Basmati Rice' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Item code', example: 'RAW-RICE-BAS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsCode()
  code: string;

  @ApiProperty({
    description: 'Item type',
    enum: ['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'],
  })
  @IsEnum(['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'])
  type: string;

  @ApiProperty({
    description: 'Tracking type — granularity at which stock for this item is identified.',
    enum: ['quantity', 'lot', 'lot_serial', 'serial'],
    example: 'lot',
  })
  @IsEnum(['quantity', 'lot', 'lot_serial', 'serial'])
  tracking: 'quantity' | 'lot' | 'lot_serial' | 'serial';

  @ApiPropertyOptional({
    description: 'Pick strategy for lot/serial tracked items',
    enum: ['none', 'fifo', 'fefo'],
    default: 'none',
  })
  @IsOptional()
  @IsEnum(['none', 'fifo', 'fefo'])
  pickStrategy?: 'none' | 'fifo' | 'fefo';

  @ApiProperty({ description: 'Category ID' })
  @IsUUID()
  categoryId: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiProperty({ description: 'Unit of measure ID' })
  @IsUUID()
  uomId: string;

  @ApiProperty({ description: 'Purchase tax group ID' })
  @IsUUID()
  purchaseTaxGroupId: string;

  @Trim()
  @ApiPropertyOptional({ description: 'HSN code for tax reporting' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string | null;

  @ApiPropertyOptional({ type: CurrencyAmountDto, description: 'Default MRP (site currency)', nullable: true })
  @IsOptional()
  @IsCurrency()
  defaultMrp?: CurrencyAmountDto | null;
}
