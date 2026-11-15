import type { PurchaseDto } from '@domain/purchases/dto/entity/purchase.dto';
import type { PurchaseHeaderDto } from '@domain/purchases/dto/entity/purchase-header.dto';
import type { PurchaseTableRowDto } from '@domain/purchases/dto/entity/purchase-table-row.dto';
import { CancelPurchaseDto } from '@domain/purchases/dto/request/cancel-purchase.dto';
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

  // Changes a purchase's header while it is in REQUESTING
  @MessagePattern({ cmd: 'le.purchases.update' })
  update(@Payload() dto: UpdatePurchaseDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.update — id: ${dto.id}`);
    return this.service.update(dto);
  }

  // Cancels a purchase with a reason
  @MessagePattern({ cmd: 'le.purchases.cancel' })
  cancel(@Payload() dto: CancelPurchaseDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.cancel — id: ${dto.id}`);
    return this.service.cancel(dto);
  }

  // Submits a purchase's items, moving it to quoting or sourcing
  @MessagePattern({ cmd: 'le.purchases.submitItems' })
  submitItems(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.submitItems — id: ${data.id}`);
    return this.service.submitItems(data.id);
  }

  // Starts every leg of a purchase still in sourcing, routing approval against the legal entity's currency
  @MessagePattern({ cmd: 'le.purchases.submit' })
  submit(@Payload() data: { id: string }, @RpcNatsHeaders() headers: NatsHeaders): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.submit — id: ${data.id}`);
    return this.service.submit(data.id, headers, headers.leCurrencyCode);
  }

  // Returns a purchase's header with its counts, progress and available actions
  @MessagePattern({ cmd: 'le.purchases.findById' })
  findById(@Payload() data: { id: string }): Promise<PurchaseHeaderDto> {
    this.logger.log(`le.purchases.findById — id: ${data.id}`);
    return this.service.findHeader(data.id);
  }

  // Returns one page of the purchases of the site chosen in the legal entity's context bar
  @MessagePattern({ cmd: 'le.purchases.table' })
  table(@Payload() state: TableState): Promise<{ result: PurchaseTableRowDto[]; count: number }> {
    this.logger.log('le.purchases.table');
    return this.purchasesService.findForTable(state);
  }

  // Deletes a purchase whose items are not submitted yet
  @MessagePattern({ cmd: 'le.purchases.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
