import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateModifierGroupDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Modifier group name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Selection type', enum: ['SINGLE', 'MULTI'] })
  @IsEnum(['SINGLE', 'MULTI'])
  selectionType: string;

  @ApiPropertyOptional({ description: 'Minimum number of selections', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minSelections?: number;

  @ApiPropertyOptional({ description: 'Maximum number of selections' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSelections?: number;

  @ApiPropertyOptional({ description: 'Display sort order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Whether the modifier group is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
