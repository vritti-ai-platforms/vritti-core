import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { type LocationRole, LocationRoleValues } from '../../constants/location-role.constants';

export class UpdateLocationDto {
  @ApiPropertyOptional({ description: 'Updated location name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Updated location code' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'Parent storage location ID (null for root)', type: String, nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ description: 'Updated display sort order' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Updated location area' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string;

  @ApiPropertyOptional({ description: 'Updated manager user ID' })
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiPropertyOptional({ description: 'Updated location role', enum: Object.values(LocationRoleValues) })
  @IsOptional()
  @IsIn(Object.values(LocationRoleValues))
  locationRole?: LocationRole;

  @ApiPropertyOptional({ description: 'Updated active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
