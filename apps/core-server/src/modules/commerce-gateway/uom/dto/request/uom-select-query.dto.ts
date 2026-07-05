import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class UomSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({ description: 'When true, only derived units (non-base) are returned' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  derivedOnly?: boolean;

  @ApiPropertyOptional({ description: 'When true, only base units are returned' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  baseOnly?: boolean;

  @ApiPropertyOptional({ description: 'Filter to UOMs sharing the given dimension' })
  @IsOptional()
  @IsUUID()
  dimensionId?: string;

  @ApiPropertyOptional({
    description:
      'Restrict to UOMs the given inventory item is allowed to transact in (primary UOM + per-item conversions + same-family UOMs).',
  })
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;

  @ApiPropertyOptional({
    description: 'Restrict to UOMs the supplier offers for this item, excluding already-linked UOMs',
  })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Exclude UOMs already on this purchase order for the selected inventory item' })
  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;
}
