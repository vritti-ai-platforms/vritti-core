import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { type LocationRole, LocationRoleValues } from '../../constants/location-role.constants';

export class CreateLocationDto {
  @ApiProperty({ description: 'Location name', example: 'Walk-in Fridge' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Location code', example: 'WIF' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ description: 'Parent storage location ID (null for root)', type: String, nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ description: 'Display sort order', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Location area', example: 'Kitchen' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string;

  @ApiPropertyOptional({ description: 'Manager user ID' })
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiProperty({
    description: 'Location role',
    enum: Object.values(LocationRoleValues),
    default: LocationRoleValues.STORAGE,
  })
  @IsIn(Object.values(LocationRoleValues))
  locationRole: LocationRole;

  @ApiPropertyOptional({ description: 'Whether the location is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
