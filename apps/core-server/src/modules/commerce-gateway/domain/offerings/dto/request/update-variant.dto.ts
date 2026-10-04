import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateVariantDto {
  @Trim({ nullify: false })
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @Trim()
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalSku?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('7')
  salesUomId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('7')
  taxClassId?: string | null;

  @ApiPropertyOptional({ description: 'Refused until the bill of materials satisfies the fulfilment type' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
