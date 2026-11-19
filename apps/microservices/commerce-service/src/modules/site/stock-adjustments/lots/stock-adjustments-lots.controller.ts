import { AddLotDto } from '@domain/stock-adjustment-lots/dto/request/add-lot.dto';
import { UpdateLotDto } from '@domain/stock-adjustment-lots/dto/request/update-lot.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type {
  StockAdjustmentLotDetailWithDisplayDto,
  StockAdjustmentLotWithDisplayDto,
  StockAdjustmentTreeLotNodeWithDisplayDto,
} from './dto/entity/stock-adjustment-lot-with-display.dto';
import { StockAdjustmentsLotsService } from './services/stock-adjustments-lots.service';

@Controller()
export class StockAdjustmentsLotsController {
  private readonly logger = new Logger(StockAdjustmentsLotsController.name);

  constructor(private readonly appService: StockAdjustmentsLotsService) {}

  @MessagePattern({ cmd: 'site.stockAdjustments.addLot' })
  addLot(@Payload() dto: AddLotDto): Promise<CreateResponseDto<StockAdjustmentLotWithDisplayDto>> {
    this.logger.log(`stockAdjustments.addLot — adjustment: ${dto.adjustmentId}`);
    return this.appService.addLot(dto.adjustmentId, {
      lotNumber: dto.lotNumber,
      manufacturingDate: dto.manufacturingDate,
      expiryDate: dto.expiryDate,
      mrp: dto.mrp !== undefined ? (dto.mrp === null ? null : BigInt(dto.mrp)) : undefined,
    });
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.updateLot' })
  updateLot(@Payload() dto: UpdateLotDto): Promise<StockAdjustmentLotWithDisplayDto> {
    this.logger.log(`stockAdjustments.updateLot — lot: ${dto.lotId}`);
    return this.appService.updateLot(dto.adjustmentId, dto.lotId, {
      lotNumber: dto.lotNumber ?? undefined,
      manufacturingDate: dto.manufacturingDate,
      expiryDate: dto.expiryDate,
      mrp: dto.mrp !== undefined ? (dto.mrp === null ? null : BigInt(dto.mrp)) : undefined,
    });
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.lots' })
  lots(@Payload() data: { adjustmentId: string }): Promise<StockAdjustmentLotWithDisplayDto[]> {
    this.logger.log(`stockAdjustments.lots — adjustment: ${data.adjustmentId}`);
    return this.appService.findByAdjustmentId(data.adjustmentId);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.tree' })
  tree(@Payload() data: { adjustmentId: string }): Promise<StockAdjustmentTreeLotNodeWithDisplayDto[]> {
    this.logger.log(`stockAdjustments.tree — adjustment: ${data.adjustmentId}`);
    return this.appService.findTree(data.adjustmentId);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.lotDetail' })
  lotDetail(@Payload() data: { adjustmentId: string; lotId: string }): Promise<StockAdjustmentLotDetailWithDisplayDto> {
    this.logger.log(`stockAdjustments.lotDetail — lot: ${data.lotId}`);
    return this.appService.findLotDetail(data.adjustmentId, data.lotId);
  }

  @MessagePattern({ cmd: 'site.stockAdjustments.removeLot' })
  removeLot(@Payload() data: { adjustmentId: string; lotId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.removeLot — lot: ${data.lotId}`);
    return this.appService.removeLot(data.adjustmentId, data.lotId);
  }
}
