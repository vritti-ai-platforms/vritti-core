import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

// Cloud owns the view state, so it arrives serialized rather than being read from Redis here
export class GetTaxRegistrationsInternalDto {
  @ApiPropertyOptional({ description: 'JSON-stringified FilterCondition[]' })
  @IsOptional()
  @IsString()
  filters?: string;

  @ApiPropertyOptional({ description: 'JSON-stringified SearchState' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'JSON-stringified SortCondition[]' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;
}
