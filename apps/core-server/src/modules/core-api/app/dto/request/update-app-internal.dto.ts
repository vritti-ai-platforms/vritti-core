import { IsStorefrontOrigin, MAX_ALLOWED_ORIGINS } from '@domain/app/allowed-origins';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { FeatureUnlocks } from '@vritti/api-sdk/catalog-resolver';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateAppInternalDto {
  @ApiPropertyOptional({ description: 'New label' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ description: 'Suspend or restore the credential without revoking it' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      'What the credential may do, keyed by bare feature code — e.g. {"people":{"graphql":["view","add"]}}. Replaces the whole set.',
  })
  @IsObject()
  @IsOptional()
  permissions?: FeatureUnlocks;

  @ApiPropertyOptional({
    description:
      'Storefront origins the hosted checkout may send a shopper back to — scheme, host and optional port only (https, or http on localhost). Replaces the whole list.',
    type: [String],
    example: ['https://shop.example', 'http://localhost:3000'],
  })
  @IsArray()
  @ArrayMaxSize(MAX_ALLOWED_ORIGINS)
  @IsStorefrontOrigin({ each: true })
  @IsOptional()
  allowedOrigins?: string[];
}
