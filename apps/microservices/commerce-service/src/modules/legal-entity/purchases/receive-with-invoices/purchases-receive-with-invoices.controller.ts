import { ReceiveWithInvoiceRefDto } from '@domain/purchases/dto/request/receive-with-invoice-ref.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { type NatsHeaders, RpcLeCurrencyCode, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { ReceiveWithInvoiceDetailDto } from '@/modules/site/purchases/receive-with-invoices/dto/entity/receive-with-invoice-detail.dto';
import type { ReceiveWithInvoiceOpenLineDto } from '@/modules/site/purchases/receive-with-invoices/dto/entity/receive-with-invoice-open-line.dto';
import { PurchasesReceiveWithInvoicesService } from '@/modules/site/purchases/receive-with-invoices/services/purchases-receive-with-invoices.service';
import { LeReceiveWithInvoiceDto } from './dto/request/le-receive-with-invoice.dto';
import { LeReceiveWithInvoiceOpenLinesQueryDto } from './dto/request/le-receive-with-invoice-open-lines-query.dto';
import { LeUpdateReceiveWithInvoiceDto } from './dto/request/le-update-receive-with-invoice.dto';

@Controller()
export class LePurchasesReceiveWithInvoicesController {
  private readonly logger = new Logger(LePurchasesReceiveWithInvoicesController.name);

  constructor(private readonly service: PurchasesReceiveWithInvoicesService) {}

  // Drafts a supplier's invoice entered with its goods at one of the legal entity's sites
  @MessagePattern({ cmd: 'le.purchases.receiveWithInvoices.create' })
  create(
    @Payload() dto: LeReceiveWithInvoiceDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<{ supplierInvoiceId: string }>> {
    this.logger.log(`le.purchases.receiveWithInvoices.create — site: ${dto.siteId}, supplier: ${dto.supplierId}`);
    const { siteId, timezone, ...receiveWithInvoice } = dto;
    return this.service.create(
      receiveWithInvoice,
      { siteId, timezone: timezone ?? null, leCurrencyCode: headers.leCurrencyCode },
      headers,
    );
  }

  // Replaces a draft Receive with Invoice, at the site it was drafted for
  @MessagePattern({ cmd: 'le.purchases.receiveWithInvoices.update' })
  update(
    @Payload() dto: LeUpdateReceiveWithInvoiceDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.receiveWithInvoices.update — invoice: ${dto.invoiceId}`);
    const { timezone, ...receiveWithInvoice } = dto;
    return this.service.update(
      receiveWithInvoice,
      { timezone: timezone ?? null, leCurrencyCode: headers.leCurrencyCode },
      headers,
    );
  }

  // Posts a draft Receive with Invoice's receipts and posts its invoice in the legal entity's currency
  @MessagePattern({ cmd: 'le.purchases.receiveWithInvoices.post' })
  post(@Payload() data: ReceiveWithInvoiceRefDto, @RpcNatsHeaders() headers: NatsHeaders): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.receiveWithInvoices.post — invoice: ${data.invoiceId}`);
    return this.service.post(data.invoiceId, headers.leCurrencyCode, headers);
  }

  // Returns a Receive with Invoice with its lines, purchases, receipts and holds
  @MessagePattern({ cmd: 'le.purchases.receiveWithInvoices.findById' })
  findById(
    @Payload() data: ReceiveWithInvoiceRefDto,
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<ReceiveWithInvoiceDetailDto> {
    this.logger.log(`le.purchases.receiveWithInvoices.findById — invoice: ${data.invoiceId}`);
    return this.service.findById(data.invoiceId, leCurrencyCode);
  }

  // Returns the supplier's allocations at one of the legal entity's sites an invoice may still receive
  @MessagePattern({ cmd: 'le.purchases.receiveWithInvoices.openLines' })
  openLines(@Payload() query: LeReceiveWithInvoiceOpenLinesQueryDto): Promise<ReceiveWithInvoiceOpenLineDto[]> {
    this.logger.log(
      `le.purchases.receiveWithInvoices.openLines — site: ${query.siteId}, supplier: ${query.supplierId}`,
    );
    const { siteId, ...openLines } = query;
    return this.service.findOpenLines(openLines, siteId);
  }

  // Discards a draft Receive with Invoice and the documents it drafted
  @MessagePattern({ cmd: 'le.purchases.receiveWithInvoices.discard' })
  discard(
    @Payload() data: ReceiveWithInvoiceRefDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.receiveWithInvoices.discard — invoice: ${data.invoiceId}`);
    return this.service.discard(data.invoiceId, headers);
  }
}
