import { CurrencyAmountDto } from '@vritti/api-sdk';
import type { PurchaseOrder, PurchaseOrderStatus } from '@/db/schema';

export class PurchaseOrderDto {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCurrencyCode: string | null;
  poNumber: string;
  status: PurchaseOrderStatus;
  currencyCode: string;
  conversionRate: number;
  orderDate: string;
  expectedBy: string | null;
  timezone: string;
  notes: string | null;
  totalAmount: CurrencyAmountDto;
  createdAt: string;
  updatedAt: string;

  static from(
    entity: PurchaseOrder,
    supplierName?: string | null,
    supplierCurrencyCode?: string | null,
  ): PurchaseOrderDto {
    const dto = new PurchaseOrderDto();
    dto.id = entity.id;
    dto.supplierId = entity.supplierId;
    dto.supplierName = supplierName ?? '';
    dto.supplierCurrencyCode = supplierCurrencyCode ?? null;
    dto.poNumber = entity.poNumber;
    dto.status = entity.status;
    dto.currencyCode = entity.currencyCode;
    dto.conversionRate = Number(entity.conversionRate);
    dto.orderDate = entity.orderDate;
    dto.expectedBy = entity.expectedBy ?? null;
    dto.timezone = entity.timezone;
    dto.notes = entity.notes ?? null;
    dto.totalAmount = CurrencyAmountDto.from(entity.totalAmount, entity.currencyCode);
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
