import { IsArray, IsUUID } from 'class-validator';

export class BulkUnlinkSupplierItemsDto {
  @IsArray()
  @IsUUID('all', { each: true })
  supplierItemIds: string[];
}
