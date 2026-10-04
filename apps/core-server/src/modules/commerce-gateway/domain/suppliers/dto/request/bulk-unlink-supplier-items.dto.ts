import { IsArray, IsUUID } from 'class-validator';

export class BulkUnlinkSupplierItemsDto {
  @IsArray()
  @IsUUID('7', { each: true })
  supplierItemIds: string[];
}
