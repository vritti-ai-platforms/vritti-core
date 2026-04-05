import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateModifierGroupDto {
  @ApiProperty({ description: 'Business unit ID this modifier group belongs to' })
  @IsUUID()
  businessUnitId: string;

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
