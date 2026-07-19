import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { majorToMinor } from '@vritti/api-sdk/money';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { AddChangeStockAdjustmentLineDto } from '../dto/request/add-change-stock-adjustment-line.dto';
import type { AddOpeningStockAdjustmentLineDto } from '../dto/request/add-opening-stock-adjustment-line.dto';
import type { AddStockAdjustmentLineItemDto } from '../dto/request/add-stock-adjustment-line-item.dto';
import type { AddStockAdjustmentLotDto } from '../dto/request/add-stock-adjustment-lot.dto';
import type { CreateStockAdjustmentDto } from '../dto/request/create-stock-adjustment.dto';
import type { UpdateChangeStockAdjustmentLineDto } from '../dto/request/update-change-stock-adjustment-line.dto';
import type { UpdateOpeningStockAdjustmentLineDto } from '../dto/request/update-opening-stock-adjustment-line.dto';
import type { UpdateStockAdjustmentDto } from '../dto/request/update-stock-adjustment.dto';
import type { UpdateStockAdjustmentLineItemDto } from '../dto/request/update-stock-adjustment-line-item.dto';
import type { UpdateStockAdjustmentLotDto } from '../dto/request/update-stock-adjustment-lot.dto';
import type { StockAdjustmentLineItemResponseDto } from '../dto/response/stock-adjustment-line-item-response.dto';
import type { StockAdjustmentLineItemTableResponseDto } from '../dto/response/stock-adjustment-line-item-table-response.dto';
import type { StockAdjustmentLineResponseDto } from '../dto/response/stock-adjustment-line-response.dto';
import type { StockAdjustmentLineTableResponseDto } from '../dto/response/stock-adjustment-line-table-response.dto';
import type { StockAdjustmentLotDetailResponseDto } from '../dto/response/stock-adjustment-lot-detail-response.dto';
import type { StockAdjustmentLotResponseDto } from '../dto/response/stock-adjustment-lot-response.dto';
import type { StockAdjustmentResponseDto } from '../dto/response/stock-adjustment-response.dto';
import type { StockAdjustmentTableResponseDto } from '../dto/response/stock-adjustment-table-response.dto';
import type { StockAdjustmentTreeNodeResponseDto } from '../dto/response/stock-adjustment-tree-response.dto';

@Injectable()
export class StockAdjustmentsGatewayService {
  private readonly logger = new Logger(StockAdjustmentsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  async findForTable(userId: string): Promise<StockAdjustmentTableResponseDto> {
    this.logger.log('site.stockAdjustments.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'commerce-stock-adjustments',
    );

    const { result, count } = await this.nats.send<{ result: StockAdjustmentResponseDto[]; count: number }>(
      'commerce',
      'site.stockAdjustments.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  async findById(id: string): Promise<StockAdjustmentResponseDto> {
    this.logger.log(`stockAdjustments.findById — id: ${id}`);
    return this.nats.send('commerce', 'site.stockAdjustments.findById', { id });
  }

  async findLines(adjustmentId: string): Promise<StockAdjustmentLineResponseDto[]> {
    this.logger.log(`stockAdjustments.lines — adjustment: ${adjustmentId}`);
    return this.nats.send('commerce', 'site.stockAdjustments.lines', { adjustmentId });
  }

  async findTree(adjustmentId: string): Promise<StockAdjustmentTreeNodeResponseDto[]> {
    this.logger.log(`stockAdjustments.tree — adjustment: ${adjustmentId}`);
    return this.nats.send('commerce', 'site.stockAdjustments.tree', { adjustmentId });
  }

  async findLinesTable(adjustmentId: string, userId: string): Promise<StockAdjustmentLineTableResponseDto> {
    this.logger.log(`stockAdjustments.linesTable — adjustment: ${adjustmentId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `stock-adjustment-${adjustmentId}-lines`,
    );
    const { result, count } = await this.nats.send<{ result: StockAdjustmentLineResponseDto[]; count: number }>(
      'commerce',
      'site.stockAdjustments.linesTable',
      { adjustmentId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  async findLinesByLotTable(
    adjustmentId: string,
    lotId: string,
    userId: string,
  ): Promise<StockAdjustmentLineTableResponseDto> {
    this.logger.log(`stockAdjustments.linesByLotTable — adjustment: ${adjustmentId}, lot: ${lotId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `stock-adjustment-${adjustmentId}-lot-${lotId}-lines`,
    );
    const { result, count } = await this.nats.send<{ result: StockAdjustmentLineResponseDto[]; count: number }>(
      'commerce',
      'site.stockAdjustments.linesByLotTable',
      { adjustmentId, lotId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  async findLots(adjustmentId: string): Promise<StockAdjustmentLotResponseDto[]> {
    this.logger.log(`stockAdjustments.lots — adjustment: ${adjustmentId}`);
    return this.nats.send('commerce', 'site.stockAdjustments.lots', { adjustmentId });
  }

  async findLotDetail(adjustmentId: string, lotId: string): Promise<StockAdjustmentLotDetailResponseDto> {
    this.logger.log(`stockAdjustments.lotDetail — adjustment: ${adjustmentId}, lot: ${lotId}`);
    return this.nats.send('commerce', 'site.stockAdjustments.lotDetail', { adjustmentId, lotId });
  }

  async addLot(
    adjustmentId: string,
    dto: AddStockAdjustmentLotDto,
  ): Promise<CreateResponseDto<StockAdjustmentLotResponseDto>> {
    this.logger.log(`stockAdjustments.addLot — adjustment: ${adjustmentId}`);
    const { mrp, ...rest } = dto;
    return this.nats.send('commerce', 'site.stockAdjustments.addLot', {
      adjustmentId,
      ...rest,
      mrp: mrp ? majorToMinor(mrp.value, mrp.currency).toString() : (mrp as null | undefined),
    });
  }

  async updateLot(
    adjustmentId: string,
    lotId: string,
    dto: UpdateStockAdjustmentLotDto,
  ): Promise<StockAdjustmentLotResponseDto> {
    this.logger.log(`stockAdjustments.updateLot — lot: ${lotId}`);
    const { mrp, ...rest } = dto;
    return this.nats.send('commerce', 'site.stockAdjustments.updateLot', {
      adjustmentId,
      lotId,
      ...rest,
      mrp: mrp ? majorToMinor(mrp.value, mrp.currency).toString() : (mrp as null | undefined),
    });
  }

  async removeLot(adjustmentId: string, lotId: string): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.removeLot — lot: ${lotId}`);
    return this.nats.send('commerce', 'site.stockAdjustments.removeLot', { adjustmentId, lotId });
  }

  async findLineById(adjustmentId: string, lineId: string): Promise<StockAdjustmentLineResponseDto> {
    this.logger.log(`stockAdjustments.lineById — adjustment: ${adjustmentId}, line: ${lineId}`);
    return this.nats.send('commerce', 'site.stockAdjustments.lineById', { adjustmentId, lineId });
  }

  async create(dto: CreateStockAdjustmentDto): Promise<CreateResponseDto<StockAdjustmentResponseDto>> {
    this.logger.log(`stockAdjustments.create — item: ${dto.inventoryItemId}, type: ${dto.type}`);
    const { unitCost, ...rest } = dto;
    return this.nats.send('commerce', 'site.stockAdjustments.create', {
      ...rest,
      unitCost: unitCost ? majorToMinor(unitCost.value, unitCost.currency).toString() : undefined,
    });
  }

  async update(id: string, dto: UpdateStockAdjustmentDto): Promise<StockAdjustmentResponseDto> {
    this.logger.log(`stockAdjustments.update — id: ${id}`);
    const { unitCost, ...rest } = dto;
    return this.nats.send('commerce', 'site.stockAdjustments.update', {
      id,
      ...rest,
      unitCost: unitCost ? majorToMinor(unitCost.value, unitCost.currency).toString() : undefined,
    });
  }

  async addOpeningLine(
    adjustmentId: string,
    dto: AddOpeningStockAdjustmentLineDto,
  ): Promise<CreateResponseDto<StockAdjustmentLineResponseDto>> {
    this.logger.log(`stockAdjustments.addOpeningLine — adjustment: ${adjustmentId}`);
    return this.nats.send('commerce', 'site.stockAdjustments.addOpeningLine', { adjustmentId, ...dto });
  }

  async addChangeLine(
    adjustmentId: string,
    dto: AddChangeStockAdjustmentLineDto,
  ): Promise<CreateResponseDto<StockAdjustmentLineResponseDto>> {
    this.logger.log(`stockAdjustments.addChangeLine — adjustment: ${adjustmentId}`);
    return this.nats.send('commerce', 'site.stockAdjustments.addChangeLine', { adjustmentId, ...dto });
  }

  async updateOpeningLine(
    adjustmentId: string,
    lineId: string,
    dto: UpdateOpeningStockAdjustmentLineDto,
  ): Promise<StockAdjustmentLineResponseDto> {
    this.logger.log(`stockAdjustments.updateOpeningLine — line: ${lineId}`);
    return this.nats.send('commerce', 'site.stockAdjustments.updateOpeningLine', { adjustmentId, lineId, ...dto });
  }

  async updateChangeLine(
    adjustmentId: string,
    lineId: string,
    dto: UpdateChangeStockAdjustmentLineDto,
  ): Promise<StockAdjustmentLineResponseDto> {
    this.logger.log(`stockAdjustments.updateChangeLine — line: ${lineId}`);
    return this.nats.send('commerce', 'site.stockAdjustments.updateChangeLine', { adjustmentId, lineId, ...dto });
  }

  async removeLine(adjustmentId: string, lineId: string): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.removeLine — line: ${lineId}`);
    return this.nats.send('commerce', 'site.stockAdjustments.removeLine', { adjustmentId, lineId });
  }

  async findLineItemsTable(
    adjustmentId: string,
    lineId: string,
    userId: string,
  ): Promise<StockAdjustmentLineItemTableResponseDto> {
    this.logger.log(`stockAdjustments.lineItemsTable — line: ${lineId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `stock-adjustment-${adjustmentId}-line-${lineId}-items`,
    );
    const { result, count } = await this.nats.send<{ result: StockAdjustmentLineItemResponseDto[]; count: number }>(
      'commerce',
      'site.stockAdjustments.lineItemsTable',
      { adjustmentId, lineId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  async addLineItem(
    adjustmentId: string,
    lineId: string,
    dto: AddStockAdjustmentLineItemDto,
  ): Promise<CreateResponseDto<StockAdjustmentLineItemResponseDto>> {
    this.logger.log(`stockAdjustments.addLineItem — line: ${lineId}, serial: ${dto.serialNumber}`);
    return this.nats.send('commerce', 'site.stockAdjustments.addLineItem', { adjustmentId, lineId, ...dto });
  }

  async updateLineItem(
    adjustmentId: string,
    lineId: string,
    itemId: string,
    dto: UpdateStockAdjustmentLineItemDto,
  ): Promise<StockAdjustmentLineItemResponseDto> {
    this.logger.log(`stockAdjustments.updateLineItem — item: ${itemId}`);
    return this.nats.send('commerce', 'site.stockAdjustments.updateLineItem', { adjustmentId, lineId, itemId, ...dto });
  }

  async removeLineItem(adjustmentId: string, lineId: string, itemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.removeLineItem — item: ${itemId}`);
    return this.nats.send('commerce', 'site.stockAdjustments.removeLineItem', { adjustmentId, lineId, itemId });
  }

  async publish(id: string): Promise<StockAdjustmentResponseDto> {
    this.logger.log(`stockAdjustments.publish — id: ${id}`);
    return this.nats.send('commerce', 'site.stockAdjustments.publish', { id });
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`stockAdjustments.delete — id: ${id}`);
    return this.nats.send('commerce', 'site.stockAdjustments.delete', { id });
  }
}
