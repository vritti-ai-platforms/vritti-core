import type { InvoiceDetailDto, InvoiceDto } from '@domain/invoices/dto/entity/invoice.dto';
import { InvoicesService } from '@domain/invoices/services/invoices.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk';
import type { CreateInvoiceDto } from './dto/request/create-invoice.dto';
import type { UpdateInvoiceDto } from './dto/request/update-invoice.dto';

@Controller()
export class InvoicesController {
  private readonly logger = new Logger(InvoicesController.name);

  constructor(private readonly service: InvoicesService) {}

  @MessagePattern({ cmd: 'invoices.table' })
  async table(
    @Payload() state: TableViewState,
  ): Promise<{ result: InvoiceDto[]; count: number }> {
    this.logger.log('invoices.table');
    return this.service.findForTable(state);
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
