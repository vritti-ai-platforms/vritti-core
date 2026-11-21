import type { InboundDeliveryCounts } from '../../repositories/inbound-deliveries.repository';

export class InboundDeliveryCountsDto {
  lineCount: number;

  // Shapes how many lines an inbound delivery has, one per tab
  static from(row: InboundDeliveryCounts): InboundDeliveryCountsDto {
    const dto = new InboundDeliveryCountsDto();
    dto.lineCount = row.lineCount;
    return dto;
  }
}
