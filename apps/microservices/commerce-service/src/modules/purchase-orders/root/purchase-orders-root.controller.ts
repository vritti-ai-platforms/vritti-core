import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import { PurchaseOrdersService } from '@domain/purchase-orders/services/purchase-orders.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk';
import { PurchaseOrderStatus } from '@/db/schema';
import type { ChangePurchaseOrderCurrencyDto } from '../dto/request/change-purchase-order-currency.dto';
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

  @MessagePattern({ cmd: 'purchaseOrders.table' })
  table(@Payload() state: TableViewState): Promise<{ result: PurchaseOrderDto[]; count: number }> {
    this.logger.log('purchaseOrders.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'purchaseOrders.select' })
  select(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('purchaseOrders.select');
    return this.service.findForSelect(data);
  }

  @MessagePattern({ cmd: 'purchaseOrders.findById' })
  findById(@Payload() data: { id: string }): Promise<PurchaseOrderDto> {
    this.logger.log(`purchaseOrders.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'purchaseOrders.create' })
  create(@Payload() dto: CreatePurchaseOrderDto): Promise<CreateResponseDto<PurchaseOrderDto>> {
    this.logger.log(`purchaseOrders.create — supplier: ${dto.supplierId}`);
    return this.appService.create(dto);
  }

  @MessagePattern({ cmd: 'purchaseOrders.updateNotes' })
  updateNotes(@Payload() data: { id: string } & UpdatePurchaseOrderNotesDto): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.updateNotes — id: ${data.id}`);
    return this.service.updateNotes(data.id, data.notes ?? null);
  }

  @MessagePattern({ cmd: 'purchaseOrders.changeSupplier' })
  changeSupplier(@Payload() data: { id: string } & ChangePurchaseOrderSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.changeSupplier — id: ${data.id}, supplier: ${data.supplierId}`);
    const { id, ...dto } = data;
    return this.appService.changeSupplier(id, dto);
  }

  @MessagePattern({ cmd: 'purchaseOrders.changeCurrency' })
  changeCurrency(@Payload() data: { id: string } & ChangePurchaseOrderCurrencyDto): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.changeCurrency — id: ${data.id}, currency: ${data.currencyCode}`);
    const { id, ...dto } = data;
    return this.appService.changeCurrency(id, dto);
  }

  @MessagePattern({ cmd: 'purchaseOrders.updateStatus' })
  updateStatus(@Payload() data: { id: string; status: string }): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.updateStatus — id: ${data.id}, status: ${data.status}`);
    return this.service.updateStatus(data.id, data.status as PurchaseOrderStatus);
  }

  @MessagePattern({ cmd: 'purchaseOrders.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
