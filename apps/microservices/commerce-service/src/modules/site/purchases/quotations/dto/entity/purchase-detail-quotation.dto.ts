import type {
  PurchaseQuotationDto,
  PurchaseQuotationItemDto,
} from '@domain/supplier-quotations/dto/entity/purchase-quotation.dto';
import Decimal from '@vritti/api-sdk/decimal';
import { CurrencyAmountDto, majorToMinor } from '@vritti/api-sdk/money';
import type { WorkspaceScope } from '@/db/schema';

export class PurchaseDetailQuotationItemDto {
  id: string;
  purchaseItemId: string | null;
  inventoryItemId: string;
  inventoryItemName: string;
  uomId: string;
  uomSymbol: string | null;
  unitPrice: CurrencyAmountDto;
  unitPricePerPrimary: CurrencyAmountDto;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;

  // Shapes a quotation line with its price per primary unit: the unit price over the primary quantity one unit holds
  static from(item: PurchaseQuotationItemDto, primaryPerUnit: number): PurchaseDetailQuotationItemDto {
    const unitPrice = majorToMinor(item.unitPrice.value, item.unitPrice.currency);
    const perPrimary =
      primaryPerUnit > 0
        ? new Decimal(unitPrice.toString()).dividedBy(primaryPerUnit).toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        : new Decimal(unitPrice.toString());
    const dto = new PurchaseDetailQuotationItemDto();
    dto.id = item.id;
    dto.purchaseItemId = item.purchaseItemId;
    dto.inventoryItemId = item.inventoryItemId;
    dto.inventoryItemName = item.inventoryItemName;
    dto.uomId = item.uomId;
    dto.uomSymbol = item.uomSymbol;
    dto.unitPrice = item.unitPrice;
    dto.unitPricePerPrimary = CurrencyAmountDto.from(BigInt(perPrimary.toFixed(0)), item.unitPrice.currency);
    dto.schemeBuyQty = item.schemeBuyQty;
    dto.schemeFreeQty = item.schemeFreeQty;
    return dto;
  }
}

export class PurchaseDetailQuotationDto {
  id: string;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: WorkspaceScope;
  quotationNumber: string;
  supplierId: string;
  supplierName: string;
  isPosted: boolean;
  validFrom: string;
  validTo: string | null;
  currencyCode: string;
  pricedItemCount: number;
  itemCount: number;
  items: PurchaseDetailQuotationItemDto[];

  // Keys the primary quantity one unit of an item holds
  static unitKey(inventoryItemId: string, uomId: string): string {
    return `${inventoryItemId}:${uomId}`;
  }

  // Shapes a quotation the purchase requested, pricing each line per primary unit from the given unit sizes
  static from(quotation: PurchaseQuotationDto, primaryPerUnit: Map<string, number>): PurchaseDetailQuotationDto {
    const dto = new PurchaseDetailQuotationDto();
    dto.id = quotation.id;
    dto.legalEntityId = quotation.legalEntityId;
    dto.siteId = quotation.siteId;
    dto.ownerScope = quotation.ownerScope;
    dto.quotationNumber = quotation.quotationNumber;
    dto.supplierId = quotation.supplierId;
    dto.supplierName = quotation.supplierName;
    dto.isPosted = quotation.isPosted;
    dto.validFrom = quotation.validFrom;
    dto.validTo = quotation.validTo;
    dto.currencyCode = quotation.currencyCode;
    dto.pricedItemCount = quotation.pricedItemCount;
    dto.itemCount = quotation.itemCount;
    dto.items = quotation.items.map((item) =>
      PurchaseDetailQuotationItemDto.from(
        item,
        primaryPerUnit.get(PurchaseDetailQuotationDto.unitKey(item.inventoryItemId, item.uomId)) ?? 1,
      ),
    );
    return dto;
  }
}
