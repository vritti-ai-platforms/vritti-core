import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class PurchaseOrderItemDefaultsResponseDto {
  @ApiPropertyOptional({
    description:
      "The supplier's unit for the item at the site, else the one asked for; null when the supplier has none",
    type: String,
    nullable: true,
  })
  uomId: string | null;

  @ApiPropertyOptional({
    description: "The supplier's own code for the item in that unit",
    type: String,
    nullable: true,
  })
  supplierItemCode: string | null;

  @ApiPropertyOptional({
    description: 'The least the supplier sells of the item per order, in that unit',
    type: Number,
    nullable: true,
  })
  minOrderQuantity: number | null;

  @ApiPropertyOptional({
    description: "The price in force at the site for the supplier's item in that unit",
    type: () => CurrencyAmountDto,
    nullable: true,
  })
  unitPrice: CurrencyAmountDto | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  schemeBuyQty: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  schemeFreeQty: number | null;

  @ApiProperty({ description: "The order date plus the supplier's lead time for the item at the site (YYYY-MM-DD)" })
  expectedDeliveryDate: string;
}
