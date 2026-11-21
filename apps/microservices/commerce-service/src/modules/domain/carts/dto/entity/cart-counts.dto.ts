import type { CartCounts } from '../../repositories/carts.repository';

export class CartCountsDto {
  itemCount: number;

  // Shapes how many lines a cart has, for its Items tab
  static from(row: CartCounts): CartCountsDto {
    const dto = new CartCountsDto();
    dto.itemCount = row.itemCount;
    return dto;
  }
}
