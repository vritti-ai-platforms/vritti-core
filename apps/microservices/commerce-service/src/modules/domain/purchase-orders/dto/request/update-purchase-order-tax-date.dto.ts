import { IsDateString, IsUUID, Matches } from 'class-validator';

export class UpdatePurchaseOrderTaxDateDto {
  @IsUUID('7')
  id: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'taxDate must be YYYY-MM-DD' })
  taxDate: string;
}
