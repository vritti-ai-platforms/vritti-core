import { ArrayNotEmpty, IsArray, IsInt, IsUUID, Max, Min } from 'class-validator';

export class BulkSetSupplierItemDefaultLeadTimeDto {
  @IsUUID('7')
  supplierId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  supplierItemIds: string[];

  // Days from order to delivery; every site of the items that does not set its own follows it
  @IsInt()
  @Min(0)
  @Max(365)
  defaultLeadTimeDays: number;
}
