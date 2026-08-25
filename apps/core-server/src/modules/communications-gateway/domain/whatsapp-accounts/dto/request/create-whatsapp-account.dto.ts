import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateWhatsappAccountDto {
  @ApiPropertyOptional({ description: 'Legal entity that owns this WABA; omit for an organization-wide account' })
  @IsOptional()
  @IsUUID()
  legalEntityId?: string | null;

  @ApiProperty({ example: '1234567890123456' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  metaBusinessId: string;

  @ApiProperty({ example: '9876543210987654' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  wabaId: string;

  @ApiProperty({ example: 'Desi Taakat' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Long-lived Meta system-user access token' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
