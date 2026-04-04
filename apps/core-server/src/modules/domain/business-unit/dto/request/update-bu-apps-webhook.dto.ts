import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString } from 'class-validator';

export class UpdateBuAppsWebhookDto {
  @ApiProperty({ description: 'App codes to assign to this business unit', example: ['inventory', 'pos'] })
  @IsArray()
  @IsString({ each: true })
  appCodes: string[];

  @ApiProperty({ description: 'Feature catalog entries for the assigned apps' })
  @IsArray()
  @Type(() => Object)
  featureCatalog: object[];
}
