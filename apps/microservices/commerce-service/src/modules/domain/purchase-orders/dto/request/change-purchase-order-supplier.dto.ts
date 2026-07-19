import { IsUUID } from 'class-validator';

export class ChangePurchaseOrderSupplierDto {
  @IsUUID()
  id: string;

  @IsUUID()
  supplierId: string;
}
