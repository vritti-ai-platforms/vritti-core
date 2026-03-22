import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserStatusValues } from '@/db/schema';

export class UpdateUserWebhookDto {
  @ApiPropertyOptional({ example: 'jane@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Jane Smith' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'ACTIVE', 'SUSPENDED'] })
  @IsOptional()
  @IsEnum(UserStatusValues)
  status?: string;
}
