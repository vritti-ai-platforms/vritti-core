import { IsUUID } from 'class-validator';

export class RequestPurchaseQuotationDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  supplierId: string;
}
