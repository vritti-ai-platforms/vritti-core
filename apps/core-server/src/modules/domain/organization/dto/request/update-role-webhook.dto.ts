import { ApiPropertyOptional } from '@nestjs/swagger';
import type { RevokedGrants } from '@vritti/api-sdk/catalog-resolver';
import { Transform } from 'class-transformer';
import { Allow, IsOptional, IsString } from 'class-validator';

export class UpdateRoleWebhookDto {
  @ApiPropertyOptional({ example: 'Inventory Manager' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Can manage all inventory operations' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: { products: ['VIEW', 'CREATE'] } })
  @IsOptional()
  @Allow()
  @Transform(({ value }) => value, { toClassOnly: true })
  features?: Record<string, { app?: string; web?: string[]; mobile?: string[] }>;

  @ApiPropertyOptional({ example: { products: { web: ['DELETE'], mobile: null } } })
  @IsOptional()
  @Allow()
  @Transform(({ value }) => value, { toClassOnly: true })
  revoked?: RevokedGrants;
}
