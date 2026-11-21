import type { PaymentTermCounts } from '../../repositories/payment-terms.repository';

export class PaymentTermCountsDto {
  ruleCount: number;

  // Shapes how many rules a payment term has, one per tab
  static from(row: PaymentTermCounts): PaymentTermCountsDto {
    const dto = new PaymentTermCountsDto();
    dto.ruleCount = row.ruleCount;
    return dto;
  }
}
