import type { PurchaseDto } from '@domain/purchases/dto/entity/purchase.dto';
import type { PurchaseActionsDto } from '@domain/purchases/dto/entity/purchase-actions.dto';
import type { PurchaseCountsDto } from '@domain/purchases/dto/entity/purchase-counts.dto';
import type { PurchaseProgressDto } from '@domain/purchases/dto/entity/purchase-progress.dto';
import type { PurchaseTableRowDto } from '@domain/purchases/dto/entity/purchase-table-row.dto';
import { CancelPurchaseDto } from '@domain/purchases/dto/request/cancel-purchase.dto';
import { ChangePurchaseMinQuotationsDto } from '@domain/purchases/dto/request/change-purchase-min-quotations.dto';
import { ChangePurchaseNotesDto } from '@domain/purchases/dto/request/change-purchase-notes.dto';
import { ClosePurchaseDto } from '@domain/purchases/dto/request/close-purchase.dto';
import { CreatePurchaseDto } from '@domain/purchases/dto/request/create-purchase.dto';
import { DisablePurchaseQuotationsDto } from '@domain/purchases/dto/request/disable-purchase-quotations.dto';
import { EnablePurchaseQuotationsDto } from '@domain/purchases/dto/request/enable-purchase-quotations.dto';
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

  // Changes an open purchase's notes
  @MessagePattern({ cmd: 'site.purchases.changeNotes' })
  changeNotes(@Payload() dto: ChangePurchaseNotesDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.changeNotes — id: ${dto.id}`);
    return this.service.changeNotes(dto);
  }

  // Requires quotations on a purchase none of whose suppliers is submitted yet
  @MessagePattern({ cmd: 'site.purchases.enableQuotations' })
  enableQuotations(
    @Payload() dto: EnablePurchaseQuotationsDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.enableQuotations — id: ${dto.id}, minQuotations: ${dto.minQuotations}`);
    return this.service.enableQuotations(dto, headers);
  }

  // Stops requiring quotations on an open purchase, with why
  @MessagePattern({ cmd: 'site.purchases.disableQuotations' })
  disableQuotations(
    @Payload() dto: DisablePurchaseQuotationsDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.disableQuotations — id: ${dto.id}`);
    return this.service.disableQuotations(dto, headers);
  }

  // Changes how many posted quotations each item needs before its supplier is submitted
  @MessagePattern({ cmd: 'site.purchases.changeMinQuotations' })
  changeMinQuotations(
    @Payload() dto: ChangePurchaseMinQuotationsDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.changeMinQuotations — id: ${dto.id}, minQuotations: ${dto.minQuotations}`);
    return this.service.changeMinQuotations(dto, headers);
  }

  // Starts every leg of a purchase still in sourcing
  @MessagePattern({ cmd: 'site.purchases.submit' })
  submit(@Payload() data: { id: string }, @RpcNatsHeaders() headers: NatsHeaders): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.submit — id: ${data.id}`);
    return this.service.submit(data.id, headers, headers.leCurrencyCode);
  }

  // Closes a purchase: suppliers with goods received stop expecting more, the others are cancelled
  @MessagePattern({ cmd: 'site.purchases.close' })
  close(@Payload() dto: ClosePurchaseDto, @RpcNatsHeaders() headers: NatsHeaders): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.close — id: ${dto.id}`);
    return this.service.close(dto, headers);
  }

  // Cancels a purchase with a reason, with its open suppliers and what they ordered
  @MessagePattern({ cmd: 'site.purchases.cancel' })
  cancel(@Payload() dto: CancelPurchaseDto, @RpcNatsHeaders() headers: NatsHeaders): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.cancel — id: ${dto.id}`);
    return this.service.cancel(dto, headers);
  }

  // Returns one purchase
  @MessagePattern({ cmd: 'site.purchases.findById' })
  findById(@Payload() data: { id: string }): Promise<PurchaseDto> {
    this.logger.log(`site.purchases.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Returns one page of the site's purchases
  @MessagePattern({ cmd: 'site.purchases.table' })
  table(@Payload() state: TableState): Promise<{ result: PurchaseTableRowDto[]; count: number }> {
    this.logger.log('site.purchases.table');
    return this.purchasesService.findForTable(state);
  }
  // Counts a purchase's item lines, suppliers and requested quotations
  @MessagePattern({ cmd: 'site.purchases.findCounts' })
  findCounts(@Payload() data: { id: string }): Promise<PurchaseCountsDto> {
    this.logger.log(`site.purchases.findCounts — id: ${data.id}`);
    return this.service.findCounts(data.id);
  }

  // Returns how far a purchase's items have got and where it stands as a whole
  @MessagePattern({ cmd: 'site.purchases.findProgress' })
  findProgress(@Payload() data: { id: string }): Promise<PurchaseProgressDto> {
    this.logger.log(`site.purchases.findProgress — id: ${data.id}`);
    return this.service.findProgress(data.id);
  }

  // Returns the actions a purchase offers and why the others are blocked
  @MessagePattern({ cmd: 'site.purchases.findActions' })
  findActions(@Payload() data: { id: string }): Promise<PurchaseActionsDto> {
    this.logger.log(`site.purchases.findActions — id: ${data.id}`);
    return this.service.findActions(data.id);
  }

  // Deletes an open purchase no supplier is added to
  @MessagePattern({ cmd: 'site.purchases.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
