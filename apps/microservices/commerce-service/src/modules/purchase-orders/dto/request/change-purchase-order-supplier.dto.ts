import { IsUUID } from 'class-validator';

export class ChangePurchaseOrderSupplierDto {
  @IsUUID()
  supplierId: string;
}
