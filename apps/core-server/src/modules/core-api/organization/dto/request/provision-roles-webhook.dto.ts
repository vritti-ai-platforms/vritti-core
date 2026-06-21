import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  Allow,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { RoleScopeValues } from '@/db/schema';

export class RoleItemDto {
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

  @ApiProperty({ example: false })
  @IsBoolean()
  isLocked: boolean;

  @ApiPropertyOptional({ description: 'App codes linked to this role', example: ['inventory', 'pos'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  appCodes?: string[];

  @ApiProperty({ example: { products: ['VIEW', 'CREATE'] } })
  @Allow()
  @Transform(({ value }) => value, { toClassOnly: true })
  features: Record<string, { web?: string[]; mobile?: string[] }>;
}

export class ProvisionRolesWebhookDto {
  @ApiProperty({ description: 'Organization ID', example: 'uuid-here' })
  @IsUUID()
  orgId: string;

  @ApiProperty({ type: [RoleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleItemDto)
  roles: RoleItemDto[];
}
