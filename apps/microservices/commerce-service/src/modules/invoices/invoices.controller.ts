import type { InvoiceDetailDto, InvoiceDto } from '@domain/invoices/dto/entity/invoice.dto';
import { InvoicesService } from '@domain/invoices/services/invoices.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { FilterCondition, SearchState, SortCondition } from '@vritti/api-sdk';
import type { CreateInvoiceDto } from './dto/request/create-invoice.dto';
import type { UpdateInvoiceDto } from './dto/request/update-invoice.dto';

@Controller()
export class InvoicesController {
  private readonly logger = new Logger(InvoicesController.name);

  constructor(private readonly service: InvoicesService) {}

  @MessagePattern({ cmd: 'invoices.table' })
  async table(@Payload() data: {
    filters: FilterCondition[];
    sort: SortCondition[];
    search: SearchState | null;
    pagination: { limit: number; offset: number };
  }): Promise<{ result: InvoiceDto[]; count: number }> {
    this.logger.log('invoices.table');
    return this.service.findForTable({
      filters: data.filters ?? [],
      sort: data.sort ?? [],
      search: data.search ?? null,
      pagination: data.pagination ?? { limit: 20, offset: 0 },
    });
  }

  @MessagePattern({ cmd: 'invoices.create' })
  async create(@Payload() dto: CreateInvoiceDto): Promise<InvoiceDto> {
    this.logger.log(`invoices.create — number: ${dto.invoiceNumber}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'invoices.findById' })
  async findById(@Payload() data: { id: string }): Promise<InvoiceDetailDto> {
    this.logger.log(`invoices.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'invoices.update' })
  async update(@Payload() data: { id: string } & UpdateInvoiceDto): Promise<InvoiceDto> {
    const { id, ...updateData } = data;
    this.logger.log(`invoices.update — id: ${id}`);
    return this.service.update(id, updateData);
  }
}
