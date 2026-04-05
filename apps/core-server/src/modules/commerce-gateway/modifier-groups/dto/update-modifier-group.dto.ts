import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateModifierGroupDto {
  @ApiPropertyOptional({ description: 'Updated modifier group name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Updated selection type', enum: ['SINGLE', 'MULTI'] })
  @IsOptional()
  @IsEnum(['SINGLE', 'MULTI'])
  selectionType?: string;

  @ApiPropertyOptional({ description: 'Updated minimum selections' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minSelections?: number;

  @ApiPropertyOptional({ description: 'Updated maximum selections' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSelections?: number;

  @ApiPropertyOptional({ description: 'Updated sort order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Updated active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
