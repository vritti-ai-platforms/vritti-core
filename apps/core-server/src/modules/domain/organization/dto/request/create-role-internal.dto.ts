import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { FeatureUnlocks, RevokedGrants } from '@vritti/api-sdk/catalog-resolver';
import { Transform } from 'class-transformer';
import { Allow, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRoleInternalDto {
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

  @ApiProperty({ description: 'Template code this role builds on', example: 'cashier' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: { products: { web: ['VIEW', 'CREATE'], mobile: ['VIEW'] } } })
  @Allow()
  @Transform(({ value }) => value, { toClassOnly: true })
  features: FeatureUnlocks;

  @ApiPropertyOptional({ example: { products: { web: ['DELETE'], mobile: null } } })
  @IsOptional()
  @Allow()
  @Transform(({ value }) => value, { toClassOnly: true })
  revoked?: RevokedGrants;
}
