import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { FeatureUnlocks } from '@vritti/api-sdk/catalog-resolver';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { AppTypeValues } from '@/db/schema';

export class CreateAppInternalDto {
  @ApiProperty({ description: 'Nexus organization ID the app belongs to' })
  @IsUUID()
  @IsNotEmpty()
  orgId: string;

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
}
