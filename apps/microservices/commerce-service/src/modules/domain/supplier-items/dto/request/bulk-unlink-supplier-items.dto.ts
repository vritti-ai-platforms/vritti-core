import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class BulkUnlinkSupplierItemsDto {
  @IsUUID('7')
  supplierId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  supplierItemIds: string[];
}
