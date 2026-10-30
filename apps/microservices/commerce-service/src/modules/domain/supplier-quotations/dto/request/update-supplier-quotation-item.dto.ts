import { IsUUID } from 'class-validator';
import { SupplierQuotationItemFieldsDto } from './supplier-quotation-item-fields.dto';

export class UpdateSupplierQuotationItemDto extends SupplierQuotationItemFieldsDto {
  @IsUUID('7')
  quotationId: string;

  @IsUUID('7')
  id: string;
}
