import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class GetUsersWebhookDto {
  @ApiProperty({ description: 'Organisation ID to fetch users for', example: 'uuid-here' })
  @IsUUID()
  orgId: string;

  @ApiPropertyOptional({ description: 'Search across fullName and email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Column to sort by', enum: ['fullName', 'email', 'status', 'role', 'createdAt'] })
  @IsOptional()
  @IsString()
  @IsIn(['fullName', 'email', 'status', 'role', 'createdAt'])
  sortField?: string;

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;

  @ApiPropertyOptional({ description: 'Filter by user status', enum: ['PENDING', 'ACTIVE', 'SUSPENDED'] })
  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'ACTIVE', 'SUSPENDED'])
  filterStatus?: string;

  @ApiPropertyOptional({ description: 'Pagination limit', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Pagination offset', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;
}
