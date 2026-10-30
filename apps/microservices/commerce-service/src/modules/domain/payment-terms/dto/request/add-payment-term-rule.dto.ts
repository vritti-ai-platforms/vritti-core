import { IsUUID } from 'class-validator';
import { PaymentTermRuleFieldsDto } from './payment-term-rule-fields.dto';

export class AddPaymentTermRuleDto extends PaymentTermRuleFieldsDto {
  @IsUUID('7')
  paymentTermId: string;
}
