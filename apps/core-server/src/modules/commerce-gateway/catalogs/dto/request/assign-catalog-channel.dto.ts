import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignCatalogChannelDto {
  @ApiProperty({ description: 'Business unit ID to map (must be the active business unit)' })
  @IsUUID()
  @IsNotEmpty()
  businessUnitId: string;

  @ApiProperty({ description: 'Sales channel ID to assign' })
  @IsUUID()
  @IsNotEmpty()
  channelId: string;
}
