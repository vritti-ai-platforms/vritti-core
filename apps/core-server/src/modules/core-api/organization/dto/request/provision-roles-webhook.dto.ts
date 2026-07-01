import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  Allow,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class RoleItemDto {
  @ApiProperty({ example: 'Inventory Manager' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Can manage all inventory operations' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  sourceRoleId?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isLocked: boolean;


  @ApiProperty({ example: { products: ['VIEW', 'CREATE'] } })
  @Allow()
  @Transform(({ value }) => value, { toClassOnly: true })
  features: Record<string, { app?: string; web?: string[]; mobile?: string[] }>;
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
