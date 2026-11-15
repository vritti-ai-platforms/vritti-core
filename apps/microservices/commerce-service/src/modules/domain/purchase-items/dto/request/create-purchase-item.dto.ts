import { IsUUID } from 'class-validator';
import { PurchaseItemFieldsDto } from './purchase-item-fields.dto';

export class CreatePurchaseItemDto extends PurchaseItemFieldsDto {
  @IsUUID('7')
  id: string;
}
