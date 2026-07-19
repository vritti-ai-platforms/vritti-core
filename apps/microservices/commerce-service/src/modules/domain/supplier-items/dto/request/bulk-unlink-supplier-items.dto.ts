import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class BulkUnlinkSupplierItemsDto {
  @IsUUID()
  supplierId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  supplierItemIds: string[];
}
