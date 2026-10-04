import { ArrayNotEmpty, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class BulkSetSupplierItemPreferredDto {
  @IsUUID('7')
  supplierId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  supplierItemIds: string[];

  @IsBoolean()
  isPreferred: boolean;
}
