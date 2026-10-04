import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class UomSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  derivedOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  baseOnly?: boolean;

  @IsOptional()
  @IsUUID('7')
  dimensionId?: string;

  @IsOptional()
  @IsUUID('7')
  inventoryItemId?: string;

  @IsOptional()
  @IsUUID('7')
  supplierId?: string;

  @IsOptional()
  @IsUUID('7')
  purchaseOrderId?: string;
}
