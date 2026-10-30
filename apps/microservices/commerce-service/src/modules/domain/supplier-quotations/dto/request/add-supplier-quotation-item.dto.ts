import { IsUUID } from 'class-validator';
import { SupplierQuotationItemFieldsDto } from './supplier-quotation-item-fields.dto';

export class AddSupplierQuotationItemDto extends SupplierQuotationItemFieldsDto {
  @IsUUID('7')
  quotationId: string;

  @IsUUID('7')
  inventoryItemId: string;

  @IsUUID('7')
  uomId: string;
}
