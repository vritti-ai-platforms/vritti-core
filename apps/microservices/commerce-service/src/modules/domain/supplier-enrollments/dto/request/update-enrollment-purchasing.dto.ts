import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsArray, IsBoolean, IsIn, IsNumber, IsUUID, Max, Min, ValidateIf } from 'class-validator';
import { type PurchaseType, PurchaseTypeValues } from '@/db/schema';

export class UpdateEnrollmentPurchasingDto {
  @IsUUID('7')
  supplierId: string;

  @IsUUID('7')
  siteId: string;

  @IsIn(Object.values(PurchaseTypeValues))
  purchaseType: PurchaseType;

  @IsBoolean()
  approvalEnabled: boolean;

  @IsArray()
  @IsUUID('7', { each: true })
  approverUserIds: string[];

  // Sourced total from which a leg needs approval; zero (or null) means every leg
  @ValidateIf((_, value) => value !== null)
  @IsCurrency()
  approvalThreshold: CurrencyAmountDto | null;

  @IsBoolean()
  qualityCheckEnabled: boolean;

  @ValidateIf((_, value) => value !== null)
  @IsUUID('7')
  quarantineLocationId: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsUUID('7')
  defaultReceiptLocationId: string | null;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  priceTolerancePct: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  qtyTolerancePct: number;

  @IsCurrency()
  amountTolerance: CurrencyAmountDto;
}
