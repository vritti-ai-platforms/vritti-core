import { ArrayNotEmpty, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class BulkSetSupplierItemPreferredDto {
  @IsUUID()
  supplierId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  supplierItemIds: string[];

  @IsBoolean()
  isPreferred: boolean;
}
