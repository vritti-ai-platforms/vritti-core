import { ArrayNotEmpty, IsArray, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class BulkSetSupplierItemLeadTimeDto {
  @IsUUID('7')
  supplierId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  supplierItemIds: string[];

  // Days from order to delivery; every site of the items that does not set its own follows it; null clears it
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays: number | null;
}
