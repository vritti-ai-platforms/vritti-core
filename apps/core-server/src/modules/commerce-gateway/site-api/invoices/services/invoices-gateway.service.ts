import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateInvoiceDto } from '../dto/request/create-invoice.dto';
import type { UpdateInvoiceDto } from '../dto/request/update-invoice.dto';
import type { InvoiceDetailResponseDto, InvoiceResponseDto } from '../dto/response/invoice-response.dto';
import type { InvoiceTableResponseDto } from '../dto/response/invoice-table-response.dto';

@Injectable()
export class InvoicesGatewayService {
  private readonly logger = new Logger(InvoicesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered, and sorted invoices for the data table
  async findForTable(userId: string): Promise<InvoiceTableResponseDto> {
    this.logger.log('invoices.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-invoices');

    const { result, count } = await this.nats.send<{ result: InvoiceResponseDto[]; count: number }>(
      'commerce',
      'invoices.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new invoice
  async create(dto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    this.logger.log(`invoices.create — number: ${dto.invoiceNumber}`);
    return this.nats.send('commerce', 'site.invoices.create', dto);
  }

  // Finds an invoice by ID with line items
  async findById(id: string): Promise<InvoiceDetailResponseDto> {
    this.logger.log(`invoices.findById — id: ${id}`);
    return this.nats.send('commerce', 'site.invoices.findById', { id });
  }

  // Updates an invoice by ID
  async update(id: string, dto: UpdateInvoiceDto): Promise<InvoiceResponseDto> {
    this.logger.log(`invoices.update — id: ${id}`);
    return this.nats.send('commerce', 'site.invoices.update', { id, ...dto });
  }
}
