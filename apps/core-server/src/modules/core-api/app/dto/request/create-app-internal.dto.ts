import { IsStorefrontOrigin, MAX_ALLOWED_ORIGINS } from '@domain/app/allowed-origins';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { FeatureUnlocks } from '@vritti/api-sdk/catalog-resolver';
import { ArrayMaxSize, IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { AppTypeValues } from '@/db/schema';

export class CreateAppInternalDto {
  @ApiProperty({ description: 'Human label for the credential', example: 'Acme storefront' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ description: 'What the credential is for', enum: AppTypeValues, example: AppTypeValues.GRAPHQL })
  @IsEnum(AppTypeValues)
  type: (typeof AppTypeValues)[keyof typeof AppTypeValues];

  @ApiPropertyOptional({
    description:
      'What the credential may do, keyed by bare feature code — e.g. {"people":{"graphql":["view","add"]}}. Omitted means the credential starts able to do nothing.',
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
