import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePosTerminalDto {
  @ApiProperty({ description: 'POS terminal name', example: 'Counter 1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'POS terminal code', example: 'POS-CTR-1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Linked POS storage location ID' })
  @IsUUID()
  storageLocationId: string;

  @ApiPropertyOptional({ description: 'Terminal description', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the terminal is active', default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
