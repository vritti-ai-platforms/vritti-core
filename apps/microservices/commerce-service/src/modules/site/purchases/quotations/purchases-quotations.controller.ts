import { RequestPurchaseQuotationDto } from '@domain/purchases/dto/request/request-purchase-quotation.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { PurchaseDetailQuotationDto } from './dto/entity/purchase-detail-quotation.dto';
import { PurchasesQuotationsService } from './services/purchases-quotations.service';

@Controller()
export class PurchasesQuotationsController {
  private readonly logger = new Logger(PurchasesQuotationsController.name);

  constructor(private readonly service: PurchasesQuotationsService) {}

  // Creates a draft legal-entity quotation from a supplier for the purchase's items
  @MessagePattern({ cmd: 'site.purchases.quotations.request' })
  request(
    @Payload() dto: RequestPurchaseQuotationDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<{ quotationId: string }>> {
    this.logger.log(`site.purchases.quotations.request — id: ${dto.id}, supplier: ${dto.supplierId}`);
    return this.service.request(dto, headers);
  }

  // Completes quotations, moving the purchase to sourcing
  @MessagePattern({ cmd: 'site.purchases.quotations.complete' })
  complete(@Payload() data: { id: string }, @RpcNatsHeaders() headers: NatsHeaders): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.quotations.complete — id: ${data.id}`);
    return this.service.complete(data.id, headers);
  }

  // Returns the quotations linked to a purchase, read in its legal entity's workspace
  @MessagePattern({ cmd: 'site.purchases.quotations.findByPurchase' })
  findByPurchase(
    @Payload() data: { id: string },
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<PurchaseDetailQuotationDto[]> {
    this.logger.log(`site.purchases.quotations.findByPurchase — id: ${data.id}`);
    return this.service.findByPurchase(data.id, headers);
  }
}
