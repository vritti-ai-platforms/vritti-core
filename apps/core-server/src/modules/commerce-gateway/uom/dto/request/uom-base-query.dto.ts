import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UomBaseQueryDto {
  @ApiPropertyOptional({ description: 'Search by name or symbol' })
  @IsOptional()
  @IsString()
  search?: string;
}
