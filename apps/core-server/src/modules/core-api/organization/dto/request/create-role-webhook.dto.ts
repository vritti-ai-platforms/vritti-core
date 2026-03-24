import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Allow, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { RoleScopeValues } from '@/db/schema';

export class CreateRoleWebhookDto {
  @ApiProperty({ description: 'Organization ID', example: 'uuid-here' })
  @IsUUID()
  orgId: string;

  @ApiProperty({ example: 'Inventory Manager' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Can manage all inventory operations' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['GLOBAL', 'SUBTREE', 'SINGLE_BU'], example: 'GLOBAL' })
  @IsEnum(RoleScopeValues)
  scope: string;

  @ApiPropertyOptional({ example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  sourceRoleId?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @ApiPropertyOptional({ description: 'App codes linked to this role', example: ['inventory', 'pos'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  appCodes?: string[];

  @ApiProperty({ example: { products: ['VIEW', 'CREATE'], orders: ['VIEW'] } })
  @Allow()
  @Transform(({ value }) => value, { toClassOnly: true })
  features: Record<string, string[]>;
}
