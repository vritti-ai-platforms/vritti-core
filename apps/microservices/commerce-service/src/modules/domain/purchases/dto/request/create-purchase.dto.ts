import { PurchaseItemFieldsDto } from '@domain/purchase-items/dto/request/purchase-item-fields.dto';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class CreatePurchaseDto {
  @Trim()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsBoolean()
  quotationsRequired: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  minQuotations?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemFieldsDto)
  items?: PurchaseItemFieldsDto[];
}
