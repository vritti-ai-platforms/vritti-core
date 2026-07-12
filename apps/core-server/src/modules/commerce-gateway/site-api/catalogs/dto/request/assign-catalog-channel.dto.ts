import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignCatalogChannelDto {
  @ApiProperty({ description: 'Site ID to map (must be the active site)' })
  @IsUUID()
  @IsNotEmpty()
  siteId: string;

  @ApiProperty({ description: 'Sales channel ID to assign' })
  @IsUUID()
  @IsNotEmpty()
  channelId: string;
}
