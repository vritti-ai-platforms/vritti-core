import type { PurchaseLegCount } from '@domain/purchase-suppliers/repositories/purchase-suppliers.repository';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { PurchaseLegDto, PurchaseSupplierDocumentsDto } from './dto/entity/purchase-leg.dto';
import { PurchasesSuppliersService } from './services/purchases-suppliers.service';

@Controller()
export class PurchasesSuppliersController {
  private readonly logger = new Logger(PurchasesSuppliersController.name);

  constructor(private readonly service: PurchasesSuppliersService) {}

  // Returns one supplier leg of a purchase with its allocations, documents, progress, actions and blockers
  @MessagePattern({ cmd: 'site.purchases.suppliers.findById' })
  findById(
    @Payload() data: { id: string; legId: string },
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<PurchaseLegDto> {
    this.logger.log(`site.purchases.suppliers.findById — id: ${data.id}, leg: ${data.legId}`);
    return this.service.findById(data.id, data.legId, headers, headers.leCurrencyCode);
  }

  // Returns one page of a purchase's supplier legs with their documents, progress, actions and blockers
  @MessagePattern({ cmd: 'site.purchases.suppliers.table' })
  table(
    @Payload() data: { id: string } & TableState,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<{ result: PurchaseLegDto[]; count: number }> {
    const { id, ...state } = data;
    this.logger.log(`site.purchases.suppliers.table — id: ${id}`);
    return this.service.findForTable(id, state, headers, headers.leCurrencyCode);
  }

  // Counts a purchase's supplier legs and their lines by step and status
  @MessagePattern({ cmd: 'site.purchases.suppliers.findCounts' })
  findCounts(@Payload() data: { id: string }): Promise<PurchaseLegCount[]> {
    this.logger.log(`site.purchases.suppliers.findCounts — id: ${data.id}`);
    return this.service.findCounts(data.id);
  }

  // Returns the documents of every supplier leg of a purchase
  @MessagePattern({ cmd: 'site.purchases.suppliers.findDocuments' })
  findDocuments(@Payload() data: { id: string }): Promise<PurchaseSupplierDocumentsDto[]> {
    this.logger.log(`site.purchases.suppliers.findDocuments — id: ${data.id}`);
    return this.service.findDocuments(data.id);
  }
}
