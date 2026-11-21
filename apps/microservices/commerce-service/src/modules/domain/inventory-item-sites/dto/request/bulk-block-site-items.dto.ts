import { IsString, MaxLength, MinLength } from 'class-validator';
import { BulkSiteItemsDto } from './bulk-site-items.dto';

export class BulkBlockSiteItemsDto extends BulkSiteItemsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}
