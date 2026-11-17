import type { PurchaseLegCount } from '@domain/purchase-suppliers/repositories/purchase-suppliers.repository';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type {
  PurchaseLegDto,
  PurchaseSupplierDocumentsDto,
} from '@/modules/site/purchases/suppliers/dto/entity/purchase-leg.dto';
import { PurchasesSuppliersService } from '@/modules/site/purchases/suppliers/services/purchases-suppliers.service';

@Controller()
export class LePurchasesSuppliersController {
  private readonly logger = new Logger(LePurchasesSuppliersController.name);

  constructor(private readonly service: PurchasesSuppliersService) {}

  // Returns one supplier leg of a purchase with its allocations, documents, progress, actions and blockers
  @MessagePattern({ cmd: 'le.purchases.suppliers.findById' })
  findById(
    @Payload() data: { id: string; legId: string },
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<PurchaseLegDto> {
    this.logger.log(`le.purchases.suppliers.findById — id: ${data.id}, leg: ${data.legId}`);
    return this.service.findById(data.id, data.legId, headers, headers.leCurrencyCode);
  }

  // Returns one page of a purchase's supplier legs with their documents, progress, actions and blockers
  @MessagePattern({ cmd: 'le.purchases.suppliers.table' })
  table(
    @Payload() data: { id: string } & TableState,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<{ result: PurchaseLegDto[]; count: number }> {
    const { id, ...state } = data;
    this.logger.log(`le.purchases.suppliers.table — id: ${id}`);
    return this.service.findForTable(id, state, headers, headers.leCurrencyCode);
  }

  // Counts a purchase's supplier legs and their lines by step and status
  @MessagePattern({ cmd: 'le.purchases.suppliers.findCounts' })
  findCounts(@Payload() data: { id: string }): Promise<PurchaseLegCount[]> {
    this.logger.log(`le.purchases.suppliers.findCounts — id: ${data.id}`);
    return this.service.findCounts(data.id);
  }

  // Returns the documents of every supplier leg of a purchase
  @MessagePattern({ cmd: 'le.purchases.suppliers.findDocuments' })
  findDocuments(@Payload() data: { id: string }): Promise<PurchaseSupplierDocumentsDto[]> {
    this.logger.log(`le.purchases.suppliers.findDocuments — id: ${data.id}`);
    return this.service.findDocuments(data.id);
  }
}
