import { IsUUID } from 'class-validator';

export class ChangePurchaseOrderSupplierDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  supplierId: string;
}
