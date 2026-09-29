import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateVariantDto {
  @IsUUID()
  id: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalSku?: string | null;

  @IsOptional()
  @IsUUID()
  salesUomId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
