import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { PurchaseOrderStatus } from '@/db/schema';
import type { PurchaseOrderRow } from '../../repositories/purchase-orders.repository';

export class PurchaseOrderDto {
  id: string;
  legalEntityId: string;
  siteId: string;
  supplierId: string;
  supplierName: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  currencyCode: string;
  exchangeRate: number;
  conversionRates: Record<string, string>;
  orderDate: string;
  taxDate: string;
  latestExpectedDeliveryDate: string | null;
  timezone: string;
  notes: string | null;
  totalAmount: CurrencyAmountDto;
  hasPublishedGoodsReceipt: boolean;
  createdAt: string;
  updatedAt: string;

  static from(row: PurchaseOrderRow): PurchaseOrderDto {
    const dto = new PurchaseOrderDto();
    dto.id = row.id;
    dto.legalEntityId = row.legalEntityId;
    dto.siteId = row.siteId;
    dto.supplierId = row.supplierId;
    dto.supplierName = row.supplierName ?? '';
    dto.poNumber = row.poNumber;
    dto.status = row.status;
    dto.currencyCode = row.currencyCode;
    dto.exchangeRate = row.exchangeRate;
    dto.conversionRates = row.conversionRates;
    dto.orderDate = row.orderDate;
    dto.taxDate = row.taxDate;
    dto.latestExpectedDeliveryDate = row.latestExpectedDeliveryDate;
    dto.timezone = row.timezone;
    dto.notes = row.notes;
    dto.totalAmount = CurrencyAmountDto.from(row.totalAmount, row.currencyCode);
    dto.hasPublishedGoodsReceipt = row.hasPublishedGoodsReceipt;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
