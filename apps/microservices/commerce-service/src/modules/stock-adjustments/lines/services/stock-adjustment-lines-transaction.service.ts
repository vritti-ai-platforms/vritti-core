import type { StockAdjustmentLineDto } from '@domain/stock-adjustment-lines/dto/entity/stock-adjustment-line.dto';
import { StockAdjustmentLinesService } from '@domain/stock-adjustment-lines/services/stock-adjustment-lines.service';
import { Injectable } from '@nestjs/common';
import type { SuccessResponseDto, TableViewState } from '@vritti/api-sdk';

@Injectable()
export class StockAdjustmentLinesTransactionService {
  constructor(private readonly linesService: StockAdjustmentLinesService) {}

  linesTable(data: { adjustmentId: string } & TableViewState): Promise<{ result: StockAdjustmentLineDto[]; count: number }> {
    return this.linesService.findForTable(data.adjustmentId, data);
  }

  lines(adjustmentId: string): Promise<StockAdjustmentLineDto[]> {
    return this.linesService.findByAdjustmentId(adjustmentId);
  }

  addLine(
    data: {
      adjustmentId: string;
      createdById: string;
      batchId?: string;
      locationId?: string;
      quantity: number;
      manufacturingDate?: string;
      expiryDate?: string;
    },
  ): Promise<StockAdjustmentLineDto> {
    return this.linesService.addLineByAdjustmentId(data.adjustmentId, {
      createdById: data.createdById,
      batchId: data.batchId,
      locationId: data.locationId,
      quantity: data.quantity,
      manufacturingDate: data.manufacturingDate,
      expiryDate: data.expiryDate,
    });
  }

  updateLine(
    data: {
      adjustmentId: string;
      lineId: string;
      quantity?: number;
      locationId?: string;
      manufacturingDate?: string;
      expiryDate?: string;
    },
  ): Promise<StockAdjustmentLineDto> {
    return this.linesService.updateLineByAdjustmentId(data.adjustmentId, data.lineId, {
      quantity: data.quantity,
      locationId: data.locationId,
      manufacturingDate: data.manufacturingDate,
      expiryDate: data.expiryDate,
    });
  }

  removeLine(data: { adjustmentId: string; lineId: string }): Promise<SuccessResponseDto> {
    return this.linesService.removeLineByAdjustmentId(data.adjustmentId, data.lineId);
  }
}
