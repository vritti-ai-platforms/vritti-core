import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class SuppliersSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({ description: 'When true, only suppliers enrollable at the session site are returned' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  enrollable?: boolean;
}
