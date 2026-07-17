import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdatePosTerminalDto {
  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'POS terminal name', example: 'Counter 1' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'POS terminal code', example: 'POS-CTR-1' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'Linked POS storage location ID' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Catalog this terminal sells from' })
  @IsOptional()
  @IsUUID()
  catalogId?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Terminal description', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ description: 'Whether the terminal is active' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
