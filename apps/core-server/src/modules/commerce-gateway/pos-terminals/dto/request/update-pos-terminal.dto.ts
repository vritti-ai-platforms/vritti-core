import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdatePosTerminalDto {
  @ApiPropertyOptional({ description: 'POS terminal name', example: 'Counter 1' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'POS terminal code', example: 'POS-CTR-1' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'Linked POS storage location ID' })
  @IsOptional()
  @IsUUID()
  storageLocationId?: string;

  @ApiPropertyOptional({ description: 'Terminal description', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the terminal is active' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
