import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class ReleaseSupplierInvoiceHoldDto {
  @IsUUID('7')
  supplierInvoiceId: string;

  @IsUUID('7')
  id: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
