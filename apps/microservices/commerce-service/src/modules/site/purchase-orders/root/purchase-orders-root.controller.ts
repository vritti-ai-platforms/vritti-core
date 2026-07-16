import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import { PurchaseOrdersService } from '@domain/purchase-orders/services/purchase-orders.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk/database';
import { RpcSiteCurrencyCode } from '@vritti/api-sdk/nats';
import { PurchaseOrderStatus } from '@/db/schema';
import type { ChangePurchaseOrderExchangeRateDto } from '../dto/request/change-purchase-order-exchange-rate.dto';
import type { ChangePurchaseOrderSupplierDto } from '../dto/request/change-purchase-order-supplier.dto';
import type { CreatePurchaseOrderDto } from '../dto/request/create-purchase-order.dto';
import type { UpdatePurchaseOrderNotesDto } from '../dto/request/update-purchase-order-notes.dto';
import { PurchaseOrdersRootService } from './services/purchase-orders-root.service';

@Controller()
export class PurchaseOrdersRootController {
  private readonly logger = new Logger(PurchaseOrdersRootController.name);

  constructor(
    private readonly service: PurchaseOrdersService,
    private readonly appService: PurchaseOrdersRootService,
  ) {}

  @MessagePattern({ cmd: 'site.purchaseOrders.table' })
  table(@Payload() state: TableViewState): Promise<{ result: PurchaseOrderDto[]; count: number }> {
    this.logger.log('purchaseOrders.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.findById' })
  findById(@Payload() data: { id: string }): Promise<PurchaseOrderDto> {
    this.logger.log(`purchaseOrders.findById — id: ${data.id}`);
    return this.appService.findById(data.id);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.create' })
  create(
    @Payload() dto: CreatePurchaseOrderDto,
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<CreateResponseDto<PurchaseOrderDto>> {
    this.logger.log(`purchaseOrders.create — supplier: ${dto.supplierId}`);
    return this.appService.create(dto, siteCurrencyCode);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.updateNotes' })
  updateNotes(@Payload() data: { id: string } & UpdatePurchaseOrderNotesDto): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.updateNotes — id: ${data.id}`);
    return this.service.updateNotes(data.id, data.notes ?? null);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.changeSupplier' })
  changeSupplier(@Payload() data: { id: string } & ChangePurchaseOrderSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.changeSupplier — id: ${data.id}, supplier: ${data.supplierId}`);
    const { id, ...dto } = data;
    return this.appService.changeSupplier(id, dto);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.changeExchangeRate' })
  changeExchangeRate(
    @Payload() data: { id: string } & ChangePurchaseOrderExchangeRateDto,
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.changeExchangeRate — id: ${data.id}, type: ${data.exchangeRateType}`);
    const { id, ...dto } = data;
    return this.appService.changeExchangeRate(id, dto, siteCurrencyCode);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.closeShort' })
  closeShort(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.closeShort — id: ${data.id}`);
    return this.service.closeShort(data.id);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.updateStatus' })
  updateStatus(@Payload() data: { id: string; status: string }): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.updateStatus — id: ${data.id}, status: ${data.status}`);
    return this.service.updateStatus(data.id, data.status as PurchaseOrderStatus);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
