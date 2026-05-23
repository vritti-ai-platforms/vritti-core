import { IsArray, IsUUID } from 'class-validator';

export class BulkUnlinkSupplierItemsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  supplierItemIds: string[];
}
