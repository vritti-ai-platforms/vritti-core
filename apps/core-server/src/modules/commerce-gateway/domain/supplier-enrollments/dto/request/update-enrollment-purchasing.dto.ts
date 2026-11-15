import { PURCHASE_TYPES, type PurchaseType } from '@commerce/purchases/constants/purchase.constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsArray, IsBoolean, IsIn, IsNumber, IsUUID, Max, Min, ValidateIf } from 'class-validator';

export class UpdateEnrollmentPurchasingDto {
  @ApiProperty({ description: 'How purchases from the supplier run at the site', enum: PURCHASE_TYPES })
  @IsIn(PURCHASE_TYPES)
  purchaseType: PurchaseType;

  @ApiProperty({ description: "Whether a purchase's leg for the supplier needs approval" })
  @IsBoolean()
  approvalEnabled: boolean;

  @ApiProperty({ type: [String], description: 'Users any one of whom approves a leg; required when approval is on' })
  @IsArray()
  @IsUUID('7', { each: true })
  approverUserIds: string[];

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description:
      "Sourced total from which approval is needed, in the legal entity's currency; null or zero means every leg",
    nullable: true,
  })
  @ValidateIf((_, value) => value !== null)
  @IsCurrency()
  approvalThreshold: CurrencyAmountDto | null;

  @ApiProperty({ description: 'Whether receipts go through quality check' })
  @IsBoolean()
  qualityCheckEnabled: boolean;

  @ApiPropertyOptional({
    description:
      "Location at the enrollment's site receipts land in for quality check; required when quality check is on",
    type: String,
    nullable: true,
  })
  @ValidateIf((_, value) => value !== null)
  @IsUUID('7')
  quarantineLocationId: string | null;

  @ApiPropertyOptional({
    description: "Location at the enrollment's site receipts land in by default",
    type: String,
    nullable: true,
  })
  @ValidateIf((_, value) => value !== null)
  @IsUUID('7')
  defaultReceiptLocationId: string | null;

  @ApiProperty({ description: 'Percent an invoice price may exceed the ordered price before it is held', example: 2 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  priceTolerancePct: number;

  @ApiProperty({ description: 'Percent an invoice quantity may exceed the received quantity before it is held' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  qtyTolerancePct: number;

  @ApiProperty({
    type: CurrencyAmountDto,
    description:
      "Amount an invoice line may exceed its expected amount before it is held, in the legal entity's currency",
  })
  @IsCurrency()
  amountTolerance: CurrencyAmountDto;
}
