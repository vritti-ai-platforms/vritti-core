import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

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
}
