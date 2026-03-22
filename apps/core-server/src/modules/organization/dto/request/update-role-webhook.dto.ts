import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Allow, IsEnum, IsOptional, IsString } from 'class-validator';
import { RoleScopeValues } from '@/db/schema';

export class UpdateRoleWebhookDto {
  @ApiPropertyOptional({ example: 'Inventory Manager' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Can manage all inventory operations' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['GLOBAL', 'SUBTREE', 'SINGLE_BU'], example: 'GLOBAL' })
  @IsOptional()
  @IsEnum(RoleScopeValues)
  scope?: string;

  @ApiPropertyOptional({ example: { products: ['VIEW', 'CREATE'] } })
  @IsOptional()
  @Allow()
  @Transform(({ value }) => value, { toClassOnly: true })
  features?: Record<string, string[]>;
}
