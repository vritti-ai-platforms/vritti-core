import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SITE_PAYMENTS } from '@vritti/commerce-permissions/payments';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId, LegalEntityId, OptionalPartyId, OrgId, PartyId, SiteId } from '@/security/decorators';
import {
  CheckoutPaymentGatewaysInput,
  ConfirmPaymentInput,
  CreatePaymentIntentInput,
  PaymentChannel,
  PaymentIntentRefInput,
  StartCheckoutInput,
} from './graphql/payment-intent.input';
import { CheckoutPaymentGateway, CheckoutSession, PaymentIntent } from './graphql/payment-intent.type';
import { PaymentIntentsGatewayService } from './services/payment-intents-gateway.service';

@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(SITE_PAYMENTS.featureCode)
export class PaymentIntentsAppResolver {
  private readonly logger = new Logger(PaymentIntentsAppResolver.name);

  constructor(private readonly service: PaymentIntentsGatewayService) {}

  // The gateways the payment page can offer: those with a payout account for this store, app and channel
  @Query(() => [CheckoutPaymentGateway], { name: 'checkoutPaymentGateways' })
  @RequirePermission(SITE_PAYMENTS.create)
  checkoutPaymentGateways(
    @OrgId() orgId: string,
    @AppId() appId: string,
    @SiteId() siteId: string | undefined,
    @LegalEntityId() legalEntityId: string | undefined,
    @Args('input', { nullable: true }) input?: CheckoutPaymentGatewaysInput,
  ): Promise<CheckoutPaymentGateway[]> {
    this.logger.log('QUERY checkoutPaymentGateways');
    return this.service.listCheckoutGateways(
      { orgId, appId, siteId, legalEntityId },
      input?.channel ?? PaymentChannel.APP,
    );
  }

  // Opens a payment for anything the app sells, through the gateway the shopper picked
  @Mutation(() => PaymentIntent, { name: 'createPaymentIntent' })
  @RequirePermission(SITE_PAYMENTS.create)
  createPaymentIntent(
    @OrgId() orgId: string,
    @AppId() appId: string,
    @OptionalPartyId() partyId: string | undefined,
    @SiteId() siteId: string | undefined,
    @LegalEntityId() legalEntityId: string | undefined,
    @Args('input') input: CreatePaymentIntentInput,
  ): Promise<PaymentIntent> {
    this.logger.log('MUTATION createPaymentIntent');
    return this.service.create({ orgId, appId, partyId, siteId, legalEntityId }, input);
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

  // Places an order from the party's cart and opens the payment for it in one call
  @Mutation(() => CheckoutSession, { name: 'startCheckoutFromCart' })
  @RequirePermission(SITE_PAYMENTS.create)
  startCheckoutFromCart(
    @OrgId() orgId: string,
    @AppId() appId: string,
    @PartyId() partyId: string,
    @SiteId() siteId: string | undefined,
    @LegalEntityId() legalEntityId: string | undefined,
    @Args('input') input: StartCheckoutInput,
  ): Promise<CheckoutSession> {
    this.logger.log('MUTATION startCheckoutFromCart');
    return this.service.startCheckoutFromCart({ orgId, appId, partyId, siteId, legalEntityId }, input);
  }
}
