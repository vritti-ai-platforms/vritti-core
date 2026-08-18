import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { AppTypeValues } from '@/db/schema';

export class CreateAppInternalDto {
  @ApiProperty({ description: 'Nexus organization ID the app belongs to' })
  @IsUUID()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({ description: 'Human label for the credential', example: 'Desi Taakat storefront' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ description: 'What the credential is for', enum: AppTypeValues, example: AppTypeValues.GRAPHQL })
  @IsEnum(AppTypeValues)
  type: (typeof AppTypeValues)[keyof typeof AppTypeValues];
}
