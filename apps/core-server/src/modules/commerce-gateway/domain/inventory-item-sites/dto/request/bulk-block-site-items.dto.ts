import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { BulkSiteItemsDto } from './bulk-site-items.dto';

export class BulkBlockSiteItemsDto extends BulkSiteItemsDto {
  @ApiProperty({ description: 'Why the site stops buying the items', example: 'Recalled batch', maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}
