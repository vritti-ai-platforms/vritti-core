import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignCatalogChannelDto {
  @IsUUID()
  @IsNotEmpty()
  catalogId: string;

  @IsUUID()
  @IsNotEmpty()
  siteId: string;

  @IsUUID()
  @IsNotEmpty()
  channelId: string;
}
