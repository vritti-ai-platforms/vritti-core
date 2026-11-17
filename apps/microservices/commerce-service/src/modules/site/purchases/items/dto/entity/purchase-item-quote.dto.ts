import Decimal from '@vritti/api-sdk/decimal';
import type {
  PurchaseDetailQuotationDto,
  PurchaseDetailQuotationItemDto,
} from '@/modules/site/purchases/quotations/dto/entity/purchase-detail-quotation.dto';

export class PurchaseItemQuoteDto {
  quotationId: string;
  quotationNumber: string;
  supplierId: string;
  supplierName: string;
  isPosted: boolean;
  validFrom: string;
  validTo: string | null;
  line: PurchaseDetailQuotationItemDto;

  // Lists every line of the given quotations that quotes the purchase item, with its quotation, cheapest per primary unit
  // first within each currency
  static forItem(quotations: PurchaseDetailQuotationDto[], purchaseItemId: string): PurchaseItemQuoteDto[] {
    return quotations
      .flatMap((quotation) =>
        quotation.items
          .filter((line) => line.purchaseItemId === purchaseItemId)
          .map((line) => {
            const dto = new PurchaseItemQuoteDto();
            dto.quotationId = quotation.id;
            dto.quotationNumber = quotation.quotationNumber;
            dto.supplierId = quotation.supplierId;
            dto.supplierName = quotation.supplierName;
            dto.isPosted = quotation.isPosted;
            dto.validFrom = quotation.validFrom;
            dto.validTo = quotation.validTo;
            dto.line = line;
            return dto;
          }),
      )
      .sort(
        (a, b) =>
          a.line.unitPricePerPrimary.currency.localeCompare(b.line.unitPricePerPrimary.currency) ||
          new Decimal(a.line.unitPricePerPrimary.value).comparedTo(b.line.unitPricePerPrimary.value),
      );
  }
}

export class PurchaseItemQuoteRowDto extends PurchaseItemQuoteDto {
  isLowest: boolean;
}
