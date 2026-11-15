import { ReceiveWithInvoiceDto } from '@domain/purchases/dto/request/receive-with-invoice.dto';
import { ReceiveWithInvoiceOpenLinesQueryDto } from '@domain/purchases/dto/request/receive-with-invoice-open-lines-query.dto';
import { ReceiveWithInvoiceRefDto } from '@domain/purchases/dto/request/receive-with-invoice-ref.dto';
import { UpdateReceiveWithInvoiceDto } from '@domain/purchases/dto/request/update-receive-with-invoice.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { ReceiveWithInvoiceDetailDto } from './dto/entity/receive-with-invoice-detail.dto';
import type { ReceiveWithInvoiceOpenLineDto } from './dto/entity/receive-with-invoice-open-line.dto';
import { PurchasesReceiveWithInvoicesService } from './services/purchases-receive-with-invoices.service';

@Controller()
export class PurchasesReceiveWithInvoicesController {
  private readonly logger = new Logger(PurchasesReceiveWithInvoicesController.name);

  constructor(private readonly service: PurchasesReceiveWithInvoicesService) {}

  // Drafts a supplier's invoice entered with its goods
  @MessagePattern({ cmd: 'site.purchases.receiveWithInvoices.create' })
  create(
    @Payload() dto: ReceiveWithInvoiceDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<{ supplierInvoiceId: string }>> {
    this.logger.log(
      `site.purchases.receiveWithInvoices.create — supplier: ${dto.supplierId}, invoice: ${dto.invoiceNumber}`,
    );
    return this.service.create(
      dto,
      { siteId: headers.siteId, timezone: headers.siteTimezone, leCurrencyCode: headers.leCurrencyCode },
      headers,
    );
  }

  // Replaces a draft Receive with Invoice
  @MessagePattern({ cmd: 'site.purchases.receiveWithInvoices.update' })
  update(
    @Payload() dto: UpdateReceiveWithInvoiceDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.receiveWithInvoices.update — invoice: ${dto.invoiceId}`);
    return this.service.update(
      dto,
      { timezone: headers.siteTimezone, leCurrencyCode: headers.leCurrencyCode },
      headers,
    );
  }

  // Posts a draft Receive with Invoice's receipts and posts its invoice
  @MessagePattern({ cmd: 'site.purchases.receiveWithInvoices.post' })
  post(@Payload() data: ReceiveWithInvoiceRefDto, @RpcNatsHeaders() headers: NatsHeaders): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.receiveWithInvoices.post — invoice: ${data.invoiceId}`);
    return this.service.post(data.invoiceId, headers.leCurrencyCode, headers);
  }

  // Returns a Receive with Invoice with its lines, purchases, receipts and holds
  @MessagePattern({ cmd: 'site.purchases.receiveWithInvoices.findById' })
  findById(
    @Payload() data: ReceiveWithInvoiceRefDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<ReceiveWithInvoiceDetailDto> {
    this.logger.log(`site.purchases.receiveWithInvoices.findById — invoice: ${data.invoiceId}`);
    return this.service.findById(data.invoiceId, headers.leCurrencyCode);
  }

  // Returns the supplier's allocations at the site an invoice may still receive
  @MessagePattern({ cmd: 'site.purchases.receiveWithInvoices.openLines' })
  openLines(
    @Payload() query: ReceiveWithInvoiceOpenLinesQueryDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<ReceiveWithInvoiceOpenLineDto[]> {
    this.logger.log(`site.purchases.receiveWithInvoices.openLines — supplier: ${query.supplierId}`);
    return this.service.findOpenLines(query, headers.siteId);
  }

  // Discards a draft Receive with Invoice and the documents it drafted
  @MessagePattern({ cmd: 'site.purchases.receiveWithInvoices.discard' })
  discard(
    @Payload() data: ReceiveWithInvoiceRefDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.receiveWithInvoices.discard — invoice: ${data.invoiceId}`);
    return this.service.discard(data.invoiceId, headers);
  }
}
