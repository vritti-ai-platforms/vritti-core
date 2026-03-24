import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Allow, IsArray, IsString } from 'class-validator';

export class UpdateBuAppsWebhookDto {
  @ApiProperty({ description: 'App codes to assign to this business unit', example: ['inventory', 'pos'] })
  @IsArray()
  @IsString({ each: true })
  appCodes: string[];

  @ApiProperty({ description: 'Feature catalog entries for the assigned apps' })
  @Allow()
  @Transform(({ value }) => value, { toClassOnly: true })
  featureCatalog: any[];
}
