import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AttributeTemplatesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by name or description' })
  @IsOptional()
  @IsString()
  search?: string;
}
