import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SITE_PAYMENTS } from '@vritti/commerce-permissions/payments';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId, LegalEntityId, OptionalPartyId, OrgId, PartyId, RequestOrigin, SiteId } from '@/security/decorators';
import {
  CheckoutRefInput,
  CheckoutStartInput,
  ConfirmPaymentInput,
  CreatePaymentIntentInput,
  PaymentIntentRefInput,
} from './graphql/payment-intent.input';
import { Checkout, PaymentIntent } from './graphql/payment-intent.type';
import { PaymentIntentsGatewayService } from './services/payment-intents-gateway.service';

@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(SITE_PAYMENTS.featureCode)
export class PaymentIntentsAppResolver {
  private readonly logger = new Logger(PaymentIntentsAppResolver.name);

  constructor(private readonly service: PaymentIntentsGatewayService) {}

  // Opens a payment for anything the app sells, through the gateway the shopper picked
  @Mutation(() => PaymentIntent, { name: 'createPaymentIntent' })
  @RequirePermission(SITE_PAYMENTS.create)
  createPaymentIntent(
    @OrgId() orgId: string,
    @AppId() appId: string,
    @OptionalPartyId() partyId: string | undefined,
    @SiteId() siteId: string | undefined,
    @LegalEntityId() legalEntityId: string | undefined,
    @RequestOrigin() origin: string | undefined,
    @Args('input') input: CreatePaymentIntentInput,
  ): Promise<PaymentIntent> {
    this.logger.log('MUTATION createPaymentIntent');
    return this.service.create({ orgId, appId, partyId, siteId, legalEntityId, origin }, input);
  }

  // Completes a payment from what the gateway's checkout handed back
  @Mutation(() => PaymentIntent, { name: 'confirmPayment' })
  @RequirePermission(SITE_PAYMENTS.create)
  confirmPayment(
    @OrgId() orgId: string,
    @AppId() appId: string,
    @OptionalPartyId() partyId: string | undefined,
    @Args('input') input: ConfirmPaymentInput,
  ): Promise<PaymentIntent> {
    this.logger.log('MUTATION confirmPayment');
    return this.service.confirm({ orgId, appId, partyId }, input);
  }

  @Query(() => PaymentIntent, { name: 'paymentIntent' })
  @RequirePermission(SITE_PAYMENTS.view)
  paymentIntent(
    @OrgId() orgId: string,
    @AppId() appId: string,
    @OptionalPartyId() partyId: string | undefined,
    @Args('input') input: PaymentIntentRefInput,
  ): Promise<PaymentIntent> {
    this.logger.log('QUERY paymentIntent');
    return this.service.findById({ orgId, appId, partyId }, input.paymentIntentId);
  }

  @Mutation(() => PaymentIntent, { name: 'cancelPaymentIntent' })
  @RequirePermission(SITE_PAYMENTS.cancel)
  cancelPaymentIntent(
    @OrgId() orgId: string,
    @AppId() appId: string,
    @OptionalPartyId() partyId: string | undefined,
    @Args('input') input: PaymentIntentRefInput,
  ): Promise<PaymentIntent> {
    this.logger.log('MUTATION cancelPaymentIntent');
    return this.service.cancel({ orgId, appId, partyId }, input.paymentIntentId);
  }

  // Freezes the party's cart — every store, or one — and opens the one payment for it
  @Mutation(() => Checkout, { name: 'startCheckout' })
  @RequirePermission(SITE_PAYMENTS.create)
  startCheckout(
    @OrgId() orgId: string,
    @AppId() appId: string,
    @PartyId() partyId: string,
    @RequestOrigin() origin: string | undefined,
    @Args('input') input: CheckoutStartInput,
  ): Promise<Checkout> {
    this.logger.log('MUTATION startCheckout');
    return this.service.startCheckout({ orgId, appId, partyId, origin }, input);
  }

  // Where a checkout stands — its payment, and the orders it became — for a return page
  @Query(() => Checkout, { name: 'checkout' })
  @RequirePermission(SITE_PAYMENTS.view)
  checkout(
    @OrgId() orgId: string,
    @AppId() appId: string,
    @PartyId() partyId: string,
    @Args('input') input: CheckoutRefInput,
  ): Promise<Checkout> {
    this.logger.log('QUERY checkout');
    return this.service.findCheckout({ orgId, appId, partyId }, input.checkoutId);
  }
}
