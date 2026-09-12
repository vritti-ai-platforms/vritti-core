import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class OfferingDimensionTemplatesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by name or description' })
  @IsOptional()
  @IsString()
  search?: string;
}
