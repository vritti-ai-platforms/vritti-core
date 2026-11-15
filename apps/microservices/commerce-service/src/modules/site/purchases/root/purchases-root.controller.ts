import type { PurchaseDto } from '@domain/purchases/dto/entity/purchase.dto';
import type { PurchaseHeaderDto } from '@domain/purchases/dto/entity/purchase-header.dto';
import type { PurchaseTableRowDto } from '@domain/purchases/dto/entity/purchase-table-row.dto';
import { CancelPurchaseDto } from '@domain/purchases/dto/request/cancel-purchase.dto';
import { CreatePurchaseDto } from '@domain/purchases/dto/request/create-purchase.dto';
import { UpdatePurchaseDto } from '@domain/purchases/dto/request/update-purchase.dto';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { PurchasesService } from './services/purchases-root.service';

@Controller()
export class PurchasesRootController {
  private readonly logger = new Logger(PurchasesRootController.name);

  constructor(
    private readonly purchasesService: PurchasesDomainService,
    private readonly service: PurchasesService,
  ) {}

  // Creates a purchase at the site
  @MessagePattern({ cmd: 'site.purchases.create' })
  create(@Payload() dto: CreatePurchaseDto): Promise<CreateResponseDto<PurchaseDto>> {
    this.logger.log('site.purchases.create');
    return this.service.create(dto);
  }

  // Changes a purchase's header while it is in REQUESTING
  @MessagePattern({ cmd: 'site.purchases.update' })
  update(@Payload() dto: UpdatePurchaseDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.update — id: ${dto.id}`);
    return this.service.update(dto);
  }

  // Cancels a purchase with a reason
  @MessagePattern({ cmd: 'site.purchases.cancel' })
  cancel(@Payload() dto: CancelPurchaseDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.cancel — id: ${dto.id}`);
    return this.service.cancel(dto);
  }

  // Submits a purchase's items, moving it to quoting or sourcing
  @MessagePattern({ cmd: 'site.purchases.submitItems' })
  submitItems(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.submitItems — id: ${data.id}`);
    return this.service.submitItems(data.id);
  }

  // Starts every leg of a purchase still in sourcing
  @MessagePattern({ cmd: 'site.purchases.submit' })
  submit(@Payload() data: { id: string }, @RpcNatsHeaders() headers: NatsHeaders): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.submit — id: ${data.id}`);
    return this.service.submit(data.id, headers, headers.leCurrencyCode);
  }

  // Returns a purchase's header with its counts, progress and available actions
  @MessagePattern({ cmd: 'site.purchases.findById' })
  findById(@Payload() data: { id: string }): Promise<PurchaseHeaderDto> {
    this.logger.log(`site.purchases.findById — id: ${data.id}`);
    return this.service.findHeader(data.id);
  }

  // Returns one page of the site's purchases
  @MessagePattern({ cmd: 'site.purchases.table' })
  table(@Payload() state: TableState): Promise<{ result: PurchaseTableRowDto[]; count: number }> {
    this.logger.log('site.purchases.table');
    return this.purchasesService.findForTable(state);
  }

  // Deletes a purchase whose items are not submitted yet
  @MessagePattern({ cmd: 'site.purchases.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
