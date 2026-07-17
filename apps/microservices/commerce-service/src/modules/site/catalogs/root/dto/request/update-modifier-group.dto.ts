import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import type { ModifierSelectionType } from '@/db/schema';

export class UpdateModifierGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['SINGLE', 'MULTI'])
  selectionType?: ModifierSelectionType;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSelections?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSelections?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateModifierGroupPayloadDto extends UpdateModifierGroupDto {
  @IsUUID()
  groupId: string;
}
