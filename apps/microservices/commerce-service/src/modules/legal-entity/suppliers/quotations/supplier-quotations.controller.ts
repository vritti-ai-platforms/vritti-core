import type {
  SupplierQuotationDetailDto,
  SupplierQuotationDto,
} from '@domain/supplier-quotations/dto/entity/supplier-quotation.dto';
import { AddSupplierQuotationItemDto } from '@domain/supplier-quotations/dto/request/add-supplier-quotation-item.dto';
import { CreateSupplierQuotationDto } from '@domain/supplier-quotations/dto/request/create-supplier-quotation.dto';
import { SupplierQuotationSiteRefDto } from '@domain/supplier-quotations/dto/request/supplier-quotation-site-ref.dto';
import { UpdateSupplierQuotationDto } from '@domain/supplier-quotations/dto/request/update-supplier-quotation.dto';
import { UpdateSupplierQuotationItemDto } from '@domain/supplier-quotations/dto/request/update-supplier-quotation-item.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { LeSupplierQuotationsService } from './services/supplier-quotations.service';

@Controller()
export class SupplierQuotationsController {
  private readonly logger = new Logger(SupplierQuotationsController.name);

  constructor(private readonly service: LeSupplierQuotationsService) {}

  @MessagePattern({ cmd: 'le.suppliers.quotations.table' })
  table(
    @Payload() data: { supplierId: string; siteId?: string } & TableViewState,
  ): Promise<{ result: SupplierQuotationDto[]; count: number }> {
    const { supplierId, siteId, ...state } = data;
    this.logger.log(`suppliers.quotations.table — supplierId: ${supplierId}, siteId: ${siteId ?? 'all'}`);
    return this.service.table(supplierId, state, siteId);
  }

  @MessagePattern({ cmd: 'le.suppliers.quotations.findById' })
  findById(@Payload() data: { id: string }): Promise<SupplierQuotationDetailDto> {
    this.logger.log(`suppliers.quotations.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'le.suppliers.quotations.create' })
  create(
    @Payload() dto: CreateSupplierQuotationDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<SupplierQuotationDto>> {
    this.logger.log(`suppliers.quotations.create — supplierId: ${dto.supplierId}`);
    return this.service.create(dto, headers.userId || null);
  }

  @MessagePattern({ cmd: 'le.suppliers.quotations.update' })
  update(@Payload() dto: UpdateSupplierQuotationDto): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.quotations.update — id: ${dto.id}`);
    return this.service.update(dto);
  }

  @MessagePattern({ cmd: 'le.suppliers.quotations.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.quotations.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }

  @MessagePattern({ cmd: 'le.suppliers.quotations.items.add' })
  addItem(@Payload() dto: AddSupplierQuotationItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.quotations.items.add — quotationId: ${dto.quotationId}`);
    return this.service.addItem(dto);
  }

  @MessagePattern({ cmd: 'le.suppliers.quotations.items.update' })
  updateItem(@Payload() dto: UpdateSupplierQuotationItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.quotations.items.update — id: ${dto.id}`);
    return this.service.updateItem(dto);
  }

  @MessagePattern({ cmd: 'le.suppliers.quotations.items.delete' })
  removeItem(@Payload() data: { quotationId: string; id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.quotations.items.delete — id: ${data.id}`);
    return this.service.removeItem(data.quotationId, data.id);
  }

  @MessagePattern({ cmd: 'le.suppliers.quotations.sites.post' })
  postToSite(
    @Payload() dto: SupplierQuotationSiteRefDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.quotations.sites.post — quotationId: ${dto.quotationId}, siteId: ${dto.siteId}`);
    return this.service.postToSite(dto.quotationId, dto.siteId, headers.userId || null);
  }

  @MessagePattern({ cmd: 'le.suppliers.quotations.sites.remove' })
  removeFromSite(@Payload() dto: SupplierQuotationSiteRefDto): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.quotations.sites.remove — quotationId: ${dto.quotationId}, siteId: ${dto.siteId}`);
    return this.service.removeFromSite(dto.quotationId, dto.siteId);
  }
}
