import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { type LocationRole, LocationRoleValues } from '@/db/schema';

export class UpdateLocationDto {
  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string | null;

  @IsOptional()
  @IsUUID()
  managerId?: string;

  @IsOptional()
  @IsIn(Object.values(LocationRoleValues))
  locationRole?: LocationRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
