import type { OrderCounts } from '../../repositories/orders.repository';

export class OrderCountsDto {
  itemCount: number;

  // Shapes how many items an order has, for its Items tab
  static from(row: OrderCounts): OrderCountsDto {
    const dto = new OrderCountsDto();
    dto.itemCount = row.itemCount;
    return dto;
  }
}
