import { PURCHASE_TYPES, type PurchaseType } from '@commerce/purchases/constants/purchase.constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class EnrollmentPurchasingResponseDto {
  @ApiProperty({ description: 'How purchases from the supplier run at the site', enum: PURCHASE_TYPES })
  purchaseType: PurchaseType;

  @ApiProperty({ description: "Whether a purchase's leg for the supplier needs approval" })
  approvalEnabled: boolean;

  @ApiProperty({ type: [String], description: 'Users any one of whom approves a leg' })
  approverUserIds: string[];

  @ApiProperty({ type: [String], description: 'Names of those users' })
  approverNames: string[];

  @ApiProperty({
    type: () => CurrencyAmountDto,
    description: "Sourced total from which approval is needed, in the legal entity's currency; zero means every leg",
  })
  approvalThreshold: CurrencyAmountDto;

  @ApiProperty({ description: 'Whether receipts go through quality check' })
  qualityCheckEnabled: boolean;

  @ApiPropertyOptional({ description: 'Location receipts land in for quality check', type: String, nullable: true })
  quarantineLocationId: string | null;

  @ApiPropertyOptional({ description: 'Name of that location', type: String, nullable: true })
  quarantineLocationName: string | null;

  @ApiPropertyOptional({ description: 'Location receipts land in by default', type: String, nullable: true })
  defaultReceiptLocationId: string | null;

  @ApiPropertyOptional({ description: 'Name of that location', type: String, nullable: true })
  defaultReceiptLocationName: string | null;

  @ApiProperty({ description: 'Percent an invoice price may exceed the ordered price before it is held', example: 2 })
  priceTolerancePct: number;

  @ApiProperty({ description: 'Percent an invoice quantity may exceed the received quantity before it is held' })
  qtyTolerancePct: number;

  @ApiProperty({
    type: () => CurrencyAmountDto,
    description:
      "Amount an invoice line may exceed its expected amount before it is held, in the legal entity's currency",
  })
  amountTolerance: CurrencyAmountDto;
}
