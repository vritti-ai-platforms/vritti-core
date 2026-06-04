import { CurrencyAmountDto } from '@vritti/api-sdk';
import type { ExchangeRateType, PurchaseOrder, PurchaseOrderStatus } from '@/db/schema';

export class PurchaseOrderDto {
  id: string;
  supplierId: string;
  supplierName: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  currencyCode: string;
  exchangeRate: number | null;
  exchangeRateType: ExchangeRateType;
  orderDate: string;
  expectedBy: string | null;
  timezone: string;
  notes: string | null;
  totalAmount: CurrencyAmountDto;
  goodsReceiptExists: boolean;
  createdAt: string;
  updatedAt: string;

  static from(entity: PurchaseOrder, supplierName?: string | null): PurchaseOrderDto {
    const dto = new PurchaseOrderDto();
    dto.id = entity.id;
    dto.supplierId = entity.supplierId;
    dto.supplierName = supplierName ?? '';
    dto.poNumber = entity.poNumber;
    dto.status = entity.status;
    dto.currencyCode = entity.currencyCode;
    dto.exchangeRate = entity.exchangeRate;
    dto.exchangeRateType = entity.exchangeRateType;
    dto.orderDate = entity.orderDate;
    dto.expectedBy = entity.expectedBy ?? null;
    dto.timezone = entity.timezone;
    dto.notes = entity.notes ?? null;
    dto.totalAmount = CurrencyAmountDto.from(entity.totalAmount, entity.currencyCode);
    dto.goodsReceiptExists = false;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
