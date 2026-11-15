import type {
  SupplierQuotationDetailDto,
  SupplierQuotationDto,
} from '@domain/supplier-quotations/dto/entity/supplier-quotation.dto';
import { AddSupplierQuotationItemDto } from '@domain/supplier-quotations/dto/request/add-supplier-quotation-item.dto';
import { CreateSupplierQuotationDto } from '@domain/supplier-quotations/dto/request/create-supplier-quotation.dto';
import { UpdateSupplierQuotationDto } from '@domain/supplier-quotations/dto/request/update-supplier-quotation.dto';
import { UpdateSupplierQuotationItemDto } from '@domain/supplier-quotations/dto/request/update-supplier-quotation-item.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SiteSupplierQuotationsService } from './services/site-supplier-quotations.service';

@Controller()
export class SiteSupplierQuotationsController {
  private readonly logger = new Logger(SiteSupplierQuotationsController.name);

  constructor(private readonly service: SiteSupplierQuotationsService) {}

  // Creates a draft quotation the caller's site owns
  @MessagePattern({ cmd: 'site.suppliers.quotations.create' })
  create(@Payload() dto: CreateSupplierQuotationDto): Promise<CreateResponseDto<SupplierQuotationDto>> {
    this.logger.log(`site.suppliers.quotations.create — supplierId: ${dto.supplierId}`);
    return this.service.create(dto);
  }

  // Adds a line to a quotation the caller's site owns
  @MessagePattern({ cmd: 'site.suppliers.quotations.items.add' })
  addItem(@Payload() dto: AddSupplierQuotationItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.quotations.items.add — quotationId: ${dto.quotationId}`);
    return this.service.addItem(dto);
  }

  // Changes the header of a quotation the caller's site owns
  @MessagePattern({ cmd: 'site.suppliers.quotations.update' })
  update(@Payload() dto: UpdateSupplierQuotationDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.quotations.update — id: ${dto.id}`);
    return this.service.update(dto);
  }

  // Changes a line of a quotation the caller's site owns
  @MessagePattern({ cmd: 'site.suppliers.quotations.items.update' })
  updateItem(@Payload() dto: UpdateSupplierQuotationItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.quotations.items.update — id: ${dto.id}`);
    return this.service.updateItem(dto);
  }

  // Posts a quotation the caller's site owns to the site
  @MessagePattern({ cmd: 'site.suppliers.quotations.post' })
  post(@Payload() data: { quotationId: string }, @RpcNatsHeaders() headers: NatsHeaders): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.quotations.post — quotationId: ${data.quotationId}`);
    return this.service.post(data.quotationId, headers.userId || null);
  }

  // Returns one of the supplier's quotations the caller's site can read: its own, or one posted to it or to its legal entity
  @MessagePattern({ cmd: 'site.suppliers.quotations.findById' })
  findById(@Payload() data: { supplierId: string; quotationId: string }): Promise<SupplierQuotationDetailDto> {
    this.logger.log(`site.suppliers.quotations.findById — supplierId: ${data.supplierId}, id: ${data.quotationId}`);
    return this.service.findById(data.supplierId, data.quotationId);
  }

  // Returns the supplier's quotations the caller's site can read
  @MessagePattern({ cmd: 'site.suppliers.quotations.table' })
  table(
    @Payload() data: { supplierId: string } & TableState,
  ): Promise<{ result: SupplierQuotationDto[]; count: number }> {
    const { supplierId, ...state } = data;
    this.logger.log(`site.suppliers.quotations.table — supplierId: ${supplierId}`);
    return this.service.table(supplierId, state);
  }

  // Deletes a quotation the caller's site owns while it is posted nowhere else
  @MessagePattern({ cmd: 'site.suppliers.quotations.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.quotations.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }

  // Removes a line from a quotation the caller's site owns
  @MessagePattern({ cmd: 'site.suppliers.quotations.items.delete' })
  removeItem(@Payload() data: { quotationId: string; id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.quotations.items.delete — id: ${data.id}`);
    return this.service.removeItem(data.quotationId, data.id);
  }

  // Removes a quotation posted to the caller's site, whoever owns it, with its prices here
  @MessagePattern({ cmd: 'site.suppliers.quotations.remove' })
  removeFromSite(@Payload() data: { quotationId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.quotations.remove — quotationId: ${data.quotationId}`);
    return this.service.removeFromSite(data.quotationId);
  }
}
