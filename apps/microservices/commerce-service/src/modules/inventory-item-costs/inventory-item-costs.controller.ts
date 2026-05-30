import {
  CostAllocationDto,
  CostsForSourceDto,
  InventoryItemCostDto,
} from '@domain/inventory-item-costs/dto/entity/inventory-item-cost.dto';
import { CostAssociationService } from '@domain/inventory-item-costs/services/cost-association.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto, TableViewState } from '@vritti/api-sdk';
import { CostSourceTypeValues } from '@/db/schema';
import type { AssociateCostDto } from './dto/request/associate-cost.dto';
import type { UpdateCostDto } from './dto/request/update-cost.dto';

@Controller()
export class InventoryItemCostsController {
  private readonly logger = new Logger(InventoryItemCostsController.name);

  constructor(private readonly service: CostAssociationService) {}

  @MessagePattern({ cmd: 'goodsReceipts.costs.findForTable' })
  async findForTable(@Payload() data: { grId: string } & TableViewState): Promise<CostsForSourceDto> {
    const { grId, ...state } = data;
    this.logger.log(`goodsReceipts.costs.findForTable — gr: ${grId}`);
    return this.service.findCostsForGoodsReceipt(grId, state as TableViewState);
  }

  @MessagePattern({ cmd: 'goodsReceipts.costs.allocations' })
  async allocations(@Payload() data: { costId: string }): Promise<CostAllocationDto[]> {
    this.logger.log(`goodsReceipts.costs.allocations — cost: ${data.costId}`);
    return this.service.findAllocationsForCost(data.costId);
  }

  @MessagePattern({ cmd: 'goodsReceipts.costs.associate' })
  async associateOnGr(
    @Payload() data: { grId: string; createdBy?: string | null } & AssociateCostDto,
  ): Promise<InventoryItemCostDto> {
    const { grId, createdBy, ...dto } = data;
    this.logger.log(`goodsReceipts.costs.associate — gr: ${grId}, category: ${dto.categoryId}`);
    return this.service.associateCost({
      sourceType: CostSourceTypeValues.GOODS_RECEIPT,
      sourceId: grId,
      categoryId: dto.categoryId,
      totalAmount: BigInt(dto.totalAmount),
      currencyCode: dto.currencyCode,
      distributionMethod: dto.distributionMethod,
      vendorRef: dto.vendorRef,
      notes: dto.notes,
      createdBy: createdBy ?? null,
    });
  }

  @MessagePattern({ cmd: 'goodsReceipts.costs.update' })
  async updateCost(@Payload() data: { costId: string } & UpdateCostDto): Promise<InventoryItemCostDto> {
    const { costId, totalAmount, ...rest } = data;
    this.logger.log(`goodsReceipts.costs.update — cost: ${costId}`);
    return this.service.updateCost(costId, {
      ...rest,
      totalAmount: totalAmount !== undefined ? BigInt(totalAmount) : undefined,
    });
  }

  @MessagePattern({ cmd: 'goodsReceipts.costs.delete' })
  async deleteCost(@Payload() data: { costId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`goodsReceipts.costs.delete — cost: ${data.costId}`);
    const result = await this.service.deleteCost(data.costId);
    return {
      success: true,
      message: `Cost row removed. ${result.affectedQuantIds.length} quant(s) recomputed.`,
    };
  }
}
