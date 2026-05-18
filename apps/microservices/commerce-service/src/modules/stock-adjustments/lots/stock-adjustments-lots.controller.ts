import type { StockAdjustmentLotDto } from '@domain/stock-adjustment-lots/dto/entity/stock-adjustment-lot.dto';
import type { StockAdjustmentLotDetailDto } from '@domain/stock-adjustment-lots/dto/entity/stock-adjustment-lot-detail.dto';
import type { StockAdjustmentTreeNode } from '@domain/stock-adjustment-lots/dto/entity/stock-adjustment-tree.dto';
import { StockAdjustmentLotsService } from '@domain/stock-adjustment-lots/services/stock-adjustment-lots.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk';
import { StockAdjustmentsLotsService } from './services/stock-adjustments-lots.service';

@Controller()
export class StockAdjustmentsLotsController {
  private readonly logger = new Logger(StockAdjustmentsLotsController.name);

  constructor(
    private readonly service: StockAdjustmentLotsService,
    private readonly appService: StockAdjustmentsLotsService,
  ) {}

  @MessagePattern({ cmd: 'stockAdjustments.lots' })
  lots(@Payload() data: { adjustmentId: string }): Promise<StockAdjustmentLotDto[]> {
    this.logger.log(`stockAdjustments.lots — adjustment: ${data.adjustmentId}`);
    return this.service.listByAdjustment(data.adjustmentId);
  }

  @MessagePattern({ cmd: 'stockAdjustments.tree' })
  tree(@Payload() data: { adjustmentId: string }): Promise<StockAdjustmentTreeNode[]> {
    this.logger.log(`stockAdjustments.tree — adjustment: ${data.adjustmentId}`);
    return this.service.findTreeForAdjustment(data.adjustmentId);
  }

  @MessagePattern({ cmd: 'stockAdjustments.lotDetail' })
  lotDetail(
    @Payload() data: { adjustmentId: string; lotId: string },
  ): Promise<StockAdjustmentLotDetailDto> {
    this.logger.log(`stockAdjustments.lotDetail — lot: ${data.lotId}`);
    return this.service.getLotDetail(data.adjustmentId, data.lotId);
  }

  @MessagePattern({ cmd: 'stockAdjustments.addLot' })
  addLot(
    @Payload()
    data: {
      adjustmentId: string;
      lotNumber: string;
      manufacturingDate?: string | null;
      expiryDate: string;
    },
  ): Promise<CreateResponseDto<StockAdjustmentLotDto>> {
    this.logger.log(`stockAdjustments.addLot — adjustment: ${data.adjustmentId}`);
    return this.appService.addLot(data.adjustmentId, data);
  }

  @MessagePattern({ cmd: 'stockAdjustments.updateLot' })
  updateLot(
    @Payload()
    data: {
      adjustmentId: string;
      lotId: string;
      lotNumber?: string;
      manufacturingDate?: string | null;
      expiryDate?: string;
    },
  ): Promise<StockAdjustmentLotDto> {
    this.logger.log(`stockAdjustments.updateLot — lot: ${data.lotId}`);
    return this.appService.updateLot(data.adjustmentId, data.lotId, {
      lotNumber: data.lotNumber,
      manufacturingDate: data.manufacturingDate,
      expiryDate: data.expiryDate,
    });
  }

  @MessagePattern({ cmd: 'stockAdjustments.removeLot' })
  removeLot(@Payload() data: { adjustmentId: string; lotId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.removeLot — lot: ${data.lotId}`);
    return this.appService.removeLot(data.adjustmentId, data.lotId);
  }
}
