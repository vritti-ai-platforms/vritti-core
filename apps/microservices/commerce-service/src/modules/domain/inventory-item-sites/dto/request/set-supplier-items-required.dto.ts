import { IsBoolean } from 'class-validator';
import { SiteItemRefDto } from './site-item-ref.dto';

export class SetSupplierItemsRequiredDto extends SiteItemRefDto {
  // Buying the item at the site needs the supplier's item set up there, whatever the site's own rule says
  @IsBoolean()
  required: boolean;
}
