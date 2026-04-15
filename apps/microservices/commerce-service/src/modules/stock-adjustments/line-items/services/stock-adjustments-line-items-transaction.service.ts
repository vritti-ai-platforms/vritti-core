import type { StockAdjustmentLineItemDto } from '@domain/stock-adjustment-line-items/dto/entity/stock-adjustment-line-item.dto';
import { StockAdjustmentLineItemsService } from '@domain/stock-adjustment-line-items/services/stock-adjustment-line-items.service';
import { Injectable } from '@nestjs/common';
import type { SuccessResponseDto, TableViewState } from '@vritti/api-sdk';

@Injectable()
export class StockAdjustmentsLineItemsTransactionService {
  constructor(private readonly lineItemsService: StockAdjustmentLineItemsService) {}

  lineItems(adjustmentId: string, lineId: string): Promise<StockAdjustmentLineItemDto[]> {
    return this.lineItemsService.listByLine(adjustmentId, lineId);
  }

  lineItemsTable(
    data: { adjustmentId: string; lineId: string } & TableViewState,
  ): Promise<{ result: StockAdjustmentLineItemDto[]; count: number }> {
    return this.lineItemsService.findForTable(data.adjustmentId, data.lineId, data);
  }

  addLineItem(data: { adjustmentId: string; lineId: string; quantity: number }): Promise<StockAdjustmentLineItemDto> {
    return this.lineItemsService.addLineItem(data.adjustmentId, data.lineId, { quantity: data.quantity });
  }

  updateLineItem(data: {
    adjustmentId: string;
    lineId: string;
    itemId: string;
    quantity: number;
  }): Promise<StockAdjustmentLineItemDto> {
    return this.lineItemsService.updateLineItem(data.adjustmentId, data.lineId, data.itemId, {
      quantity: data.quantity,
    });
  }

  removeLineItem(data: { adjustmentId: string; lineId: string; itemId: string }): Promise<SuccessResponseDto> {
    return this.lineItemsService.removeLineItem(data.adjustmentId, data.lineId, data.itemId);
  }
}
