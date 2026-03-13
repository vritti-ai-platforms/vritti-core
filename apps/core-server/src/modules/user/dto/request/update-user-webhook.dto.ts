import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRoleValues, UserStatusValues } from '@/db/schema';

export class UpdateUserWebhookDto {
  @ApiPropertyOptional({ example: 'Jane Smith' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @ApiPropertyOptional({ enum: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'] })
  @IsOptional()
  @IsEnum(UserRoleValues)
  role?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'ACTIVE', 'SUSPENDED'] })
  @IsOptional()
  @IsEnum(UserStatusValues)
  status?: string;
}
