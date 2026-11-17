import { IsString, MaxLength, MinLength } from 'class-validator';
import { SiteItemRefDto } from './site-item-ref.dto';

export class BlockSiteItemDto extends SiteItemRefDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}
