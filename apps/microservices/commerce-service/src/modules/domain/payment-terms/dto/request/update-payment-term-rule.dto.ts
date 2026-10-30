import { IsUUID } from 'class-validator';
import { PaymentTermRuleFieldsDto } from './payment-term-rule-fields.dto';

export class UpdatePaymentTermRuleDto extends PaymentTermRuleFieldsDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  paymentTermId: string;
}
