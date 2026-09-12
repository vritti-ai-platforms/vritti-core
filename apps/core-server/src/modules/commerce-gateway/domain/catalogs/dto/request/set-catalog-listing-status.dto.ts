import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetCatalogListingStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}
