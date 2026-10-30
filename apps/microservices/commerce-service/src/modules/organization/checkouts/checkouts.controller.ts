import type { CheckoutStartedDto, CheckoutStatusDto } from '@domain/checkouts/dto/entity/checkout.dto';
import {
  BindCheckoutIntentDto,
  CancelCheckoutDto,
  CheckoutRefDto,
  CompleteCheckoutDto,
  StartCheckoutDto,
} from '@domain/checkouts/dto/request/checkout-request.dto';
import { CheckoutsDomainService } from '@domain/checkouts/services/checkouts.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';

// A checkout reaches across stores, so it lives at the organization; each store's cart is read under its own scope
@Controller()
export class CheckoutsController {
  private readonly logger = new Logger(CheckoutsController.name);

  constructor(private readonly service: CheckoutsDomainService) {}

  // Freezes the shopper's carts at the chosen stores into one checkout awaiting one payment
  @MessagePattern({ cmd: 'org.checkouts.start' })
  start(@Payload() dto: StartCheckoutDto, @RpcNatsHeaders() headers: NatsHeaders): Promise<CheckoutStartedDto> {
    this.logger.log(`org.checkouts.start — party: ${dto.partyId}, key: ${dto.checkoutKey}`);
    return this.service.start(dto, headers);
  }

  // Stamps the payment opened for a checkout
  @MessagePattern({ cmd: 'org.checkouts.bindIntent' })
  bindIntent(@Payload() dto: BindCheckoutIntentDto): Promise<CheckoutStatusDto> {
    this.logger.log(`org.checkouts.bindIntent — checkout: ${dto.checkoutId}, intent: ${dto.paymentIntentId}`);
    return this.service.bindIntent(dto);
  }

  // Records the captured payment and makes one paid order per store
  @MessagePattern({ cmd: 'org.checkouts.complete' })
  complete(@Payload() dto: CompleteCheckoutDto): Promise<CheckoutStatusDto> {
    this.logger.log(`org.checkouts.complete — checkout: ${dto.checkoutId}, intent: ${dto.paymentIntentId}`);
    return this.service.complete(dto);
  }

  // Abandons an unpaid checkout
  @MessagePattern({ cmd: 'org.checkouts.cancel' })
  cancel(@Payload() dto: CancelCheckoutDto): Promise<CheckoutStatusDto> {
    this.logger.log(`org.checkouts.cancel — checkout: ${dto.checkoutId}`);
    return this.service.cancel(dto);
  }

  // Where a checkout stands, with the orders it has become
  @MessagePattern({ cmd: 'org.checkouts.get' })
  get(@Payload() dto: CheckoutRefDto): Promise<CheckoutStatusDto> {
    this.logger.log(`org.checkouts.get — checkout: ${dto.checkoutId}`);
    return this.service.get(dto.checkoutId, dto.partyId);
  }
}
