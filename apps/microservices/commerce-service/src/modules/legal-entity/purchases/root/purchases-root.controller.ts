import type { PurchaseDto } from '@domain/purchases/dto/entity/purchase.dto';
import type { PurchaseActionsDto } from '@domain/purchases/dto/entity/purchase-actions.dto';
import type { PurchaseCountsDto } from '@domain/purchases/dto/entity/purchase-counts.dto';
import type { PurchaseProgressDto } from '@domain/purchases/dto/entity/purchase-progress.dto';
import type { PurchaseTableRowDto } from '@domain/purchases/dto/entity/purchase-table-row.dto';
import { CancelPurchaseDto } from '@domain/purchases/dto/request/cancel-purchase.dto';
import { ClosePurchaseDto } from '@domain/purchases/dto/request/close-purchase.dto';
import { UpdatePurchaseDto } from '@domain/purchases/dto/request/update-purchase.dto';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { PurchasesService } from '@/modules/site/purchases/root/services/purchases-root.service';
import { LeCreatePurchaseDto } from './dto/request/le-create-purchase.dto';

@Controller()
export class LePurchasesRootController {
  private readonly logger = new Logger(LePurchasesRootController.name);

  constructor(
    private readonly purchasesService: PurchasesDomainService,
    private readonly service: PurchasesService,
  ) {}

  // Creates a purchase at one of the legal entity's sites
  @MessagePattern({ cmd: 'le.purchases.create' })
  create(@Payload() dto: LeCreatePurchaseDto): Promise<CreateResponseDto<PurchaseDto>> {
    this.logger.log(`le.purchases.create — site: ${dto.siteId}`);
    return this.service.create(dto, dto.siteId);
  }

  // Changes an open purchase's header
  @MessagePattern({ cmd: 'le.purchases.update' })
  update(@Payload() dto: UpdatePurchaseDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.update — id: ${dto.id}`);
    return this.service.update(dto);
  }

  // Starts every leg of a purchase still in sourcing, routing approval against the legal entity's currency
  @MessagePattern({ cmd: 'le.purchases.submit' })
  submit(@Payload() data: { id: string }, @RpcNatsHeaders() headers: NatsHeaders): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.submit — id: ${data.id}`);
    return this.service.submit(data.id, headers, headers.leCurrencyCode);
  }

  // Closes a purchase: suppliers with goods received stop expecting more, the others are cancelled
  @MessagePattern({ cmd: 'le.purchases.close' })
  close(@Payload() dto: ClosePurchaseDto, @RpcNatsHeaders() headers: NatsHeaders): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.close — id: ${dto.id}`);
    return this.service.close(dto, headers);
  }

  // Cancels a purchase with a reason, with its open suppliers and what they ordered
  @MessagePattern({ cmd: 'le.purchases.cancel' })
  cancel(@Payload() dto: CancelPurchaseDto, @RpcNatsHeaders() headers: NatsHeaders): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.cancel — id: ${dto.id}`);
    return this.service.cancel(dto, headers);
  }

  // Returns one purchase
  @MessagePattern({ cmd: 'le.purchases.findById' })
  findById(@Payload() data: { id: string }): Promise<PurchaseDto> {
    this.logger.log(`le.purchases.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Returns one page of the purchases of the site chosen in the legal entity's context bar
  @MessagePattern({ cmd: 'le.purchases.table' })
  table(@Payload() state: TableState): Promise<{ result: PurchaseTableRowDto[]; count: number }> {
    this.logger.log('le.purchases.table');
    return this.purchasesService.findForTable(state);
  }
  // Counts a purchase's item lines, suppliers and requested quotations
  @MessagePattern({ cmd: 'le.purchases.findCounts' })
  findCounts(@Payload() data: { id: string }): Promise<PurchaseCountsDto> {
    this.logger.log(`le.purchases.findCounts — id: ${data.id}`);
    return this.service.findCounts(data.id);
  }

  // Returns how far a purchase's items have got and where it stands as a whole
  @MessagePattern({ cmd: 'le.purchases.findProgress' })
  findProgress(@Payload() data: { id: string }): Promise<PurchaseProgressDto> {
    this.logger.log(`le.purchases.findProgress — id: ${data.id}`);
    return this.service.findProgress(data.id);
  }

  // Returns the actions a purchase offers and why the others are blocked
  @MessagePattern({ cmd: 'le.purchases.findActions' })
  findActions(@Payload() data: { id: string }): Promise<PurchaseActionsDto> {
    this.logger.log(`le.purchases.findActions — id: ${data.id}`);
    return this.service.findActions(data.id);
  }

  // Deletes an open purchase no supplier is added to
  @MessagePattern({ cmd: 'le.purchases.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
