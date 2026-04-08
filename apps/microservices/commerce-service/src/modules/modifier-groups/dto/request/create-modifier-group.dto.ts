import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import type { ModifierSelectionType } from '@/db/schema';

export class CreateModifierGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['SINGLE', 'MULTI'])
  selectionType: ModifierSelectionType;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSelections?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSelections?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
