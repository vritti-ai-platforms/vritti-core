import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetCatalogListingVisibilityDto {
  @ApiProperty({ description: 'False hides the listing on this channel' })
  @IsBoolean()
  visible: boolean;
}
