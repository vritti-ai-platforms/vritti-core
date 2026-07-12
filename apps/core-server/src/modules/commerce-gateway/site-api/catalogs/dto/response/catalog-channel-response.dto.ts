import { ApiProperty } from '@nestjs/swagger';

export class CatalogChannelResponseDto {
  @ApiProperty({ description: 'Catalog-channel assignment ID' })
  id: string;

  @ApiProperty({ description: 'Catalog ID' })
  catalogId: string;

  @ApiProperty({ description: 'Site ID this assignment applies to' })
  siteId: string;

  @ApiProperty({ description: 'Sales channel ID' })
  channelId: string;

  @ApiProperty({ description: 'Sales channel name' })
  channelName: string;

  @ApiProperty({ description: 'Sales channel kind' })
  channelKind: string;
}
