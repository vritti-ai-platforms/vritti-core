import { CartItemDto, type CartItemRow } from '@domain/carts/dto/entity/cart.dto';
import { CartsDomainService } from '@domain/carts/services/carts.service';
import type { CheckoutCustomerDto } from '@domain/orders/dto/entity/order-checkout.dto';
import { OrdersDomainService } from '@domain/orders/services/orders.service';
import { PartiesDomainRepository } from '@domain/parties/repositories/parties.repository';
import { PartyAddressesDomainRepository } from '@domain/party-addresses/repositories/party-addresses.repository';
import { PartyCommunicationsDomainService } from '@domain/party-communications/services/party-communications.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { NatsHeaders } from '@vritti/api-sdk/nats';
import { variantLabel } from '@/common/variant-label';
import {
  type Checkout,
  type CheckoutLine,
  CheckoutStatusValues,
  OrderTypeValues,
  PartyCommunicationChannelValues,
} from '@/db/schema';
import { type CheckoutOrderRefDto, CheckoutStartedDto, CheckoutStatusDto } from '../dto/entity/checkout.dto';
import type {
  BindCheckoutIntentDto,
  CancelCheckoutDto,
  CompleteCheckoutDto,
  StartCheckoutDto,
} from '../dto/request/checkout-request.dto';
import { CheckoutsDomainRepository } from '../repositories/checkouts.repository';

// How long the shopper has to pay; the payment intent is given the same deadline
const CHECKOUT_TTL_MS = 10 * 60 * 1000;
// orders.customer_phone is varchar(20)
const CUSTOMER_PHONE_MAX = 20;

// One store's lines of a checkout, in the order they were frozen
interface StoreShare {
  siteId: string;
  legalEntityId: string;
  lines: CheckoutLine[];
}

// A checkout freezes the carts the shopper is paying for and turns into one order per store once the money lands
@Injectable()
export class CheckoutsDomainService {
  private readonly logger = new Logger(CheckoutsDomainService.name);

  constructor(
    private readonly repository: CheckoutsDomainRepository,
    private readonly database: PrimaryDatabaseService,
    private readonly cartsService: CartsDomainService,
    private readonly ordersService: OrdersDomainService,
    private readonly partiesRepository: PartiesDomainRepository,
    private readonly addressesRepository: PartyAddressesDomainRepository,
    private readonly communicationsService: PartyCommunicationsDomainService,
  ) {}

  // Freezes the shopper's carts at the chosen stores into one checkout awaiting one payment
  async start(dto: StartCheckoutDto, headers: NatsHeaders): Promise<CheckoutStartedDto> {
    const party = await this.partiesRepository.findById(dto.partyId);
    if (!party) throw new NotFoundException('Customer not found.');

    // Who is paying — returned with the checkout so the payment gateway's page comes prefilled
    const [phone, email] = await Promise.all([
      this.communicationsService.findPrimary(dto.partyId, PartyCommunicationChannelValues.PHONE),
      this.communicationsService.findPrimary(dto.partyId, PartyCommunicationChannelValues.EMAIL),
    ]);
    const customer: CheckoutCustomerDto = {
      name: party.displayName ?? null,
      phone: phone?.value ?? null,
      email: email?.value ?? null,
    };

    const existing = await this.repository.findByKey(dto.partyId, dto.checkoutKey);
    if (existing) return this.reuse(existing, customer);

    const sites = dto.siteIds?.length ? dto.sites.filter((site) => dto.siteIds?.includes(site.siteId)) : dto.sites;
    const carts = await this.cartsService.findForCheckoutAtSites(
      dto.partyId,
      dto.currencyCode,
      dto.appId,
      sites,
      headers,
    );
    const priced = carts.flatMap((cart) =>
      cart.lines.map((row) => ({ store: cart, row, view: CartItemDto.from(row) })),
    );
    const available = priced.filter((line) => line.view.isAvailable);
    if (available.length === 0) {
      throw new BadRequestException({
        label: 'Cart Empty',
        detail: 'There is nothing in the cart that can be bought. Add a product before checking out.',
      });
    }

    const unavailable = priced.filter((line) => !line.view.isAvailable);
    if (unavailable.length > 0) {
      const names = unavailable.map((line) => line.view.name || line.view.code || line.row.offeringVariantId);
      throw new ConflictException({
        label: 'Cart Changed',
        detail: `${names.join(', ')} can no longer be bought. Review your cart before paying.`,
      });
    }

    const deliveryAddress = dto.addressId ? await this.resolveAddress(dto.partyId, dto.addressId) : null;
    const lines = available.map(({ store, row }) => toFrozenLine(store, row));
    const totalAmount = lines.reduce((sum, line) => sum + line.lineTotal, 0n);

    this.logger.log(`checkouts.start — party: ${dto.partyId}, stores: ${carts.length}, lines: ${lines.length}`);
    return this.repository
      .transaction(async () => {
        const checkout = await this.repository.create({
          appId: dto.appId,
          partyId: dto.partyId,
          currencyCode: dto.currencyCode,
          totalAmount,
          gatewayCode: dto.gatewayCode,
          checkoutKey: dto.checkoutKey,
          customerName: party.displayName ?? null,
          customerPhone: phone?.value.slice(0, CUSTOMER_PHONE_MAX) ?? null,
          customerEmail: email?.value ?? null,
          deliveryAddress,
          notes: dto.notes ?? null,
          expiresAt: new Date(Date.now() + CHECKOUT_TTL_MS),
        });
        const frozen = await this.repository.createLines(lines.map((line) => ({ ...line, checkoutId: checkout.id })));
        return CheckoutStartedDto.from(checkout, frozen, customer);
      })
      .catch(async (error: unknown) => {
        // Two submits with the same key raced past the lookup above; the unique key lets one through, and the other
        // answers with the checkout that one opened
        const winner = await this.repository.findByKey(dto.partyId, dto.checkoutKey);
        if (!winner) throw error;
        return this.reuse(winner, customer);
      });
  }

  // Answers a repeated checkout with the one its key already opened
  private async reuse(checkout: Checkout, customer: CheckoutCustomerDto): Promise<CheckoutStartedDto> {
    if (checkout.status === CheckoutStatusValues.CANCELLED) {
      throw new ConflictException({
        label: 'Checkout Ended',
        detail: 'This checkout has ended without payment. Reload the page to check out again.',
      });
    }
    this.logger.log(`checkouts.start — reusing checkout ${checkout.id} for the same key`);
    return CheckoutStartedDto.from(checkout, await this.repository.findLines(checkout.id), customer, true);
  }

  // Stamps the payment opened for a checkout, so a late event for it still finds the checkout
  async bindIntent(dto: BindCheckoutIntentDto): Promise<CheckoutStatusDto> {
    const checkout = await this.requireById(dto.checkoutId);
    if (checkout.paymentIntentId && checkout.paymentIntentId !== dto.paymentIntentId) {
      throw new ConflictException({
        label: 'Checkout Already Paying',
        detail: 'Another payment was already opened for this checkout.',
      });
    }
    const bound = checkout.paymentIntentId
      ? checkout
      : await this.repository.update(checkout.id, { paymentIntentId: dto.paymentIntentId });
    return this.statusOf(bound);
  }

  // Records the captured payment and turns the checkout into one paid order per store, all in one transaction.
  // Idempotent per payment intent
  async complete(dto: CompleteCheckoutDto): Promise<CheckoutStatusDto> {
    return this.database.runInTransaction(async () => {
      const checkout = await this.repository.findByIdForUpdate(dto.checkoutId);
      if (!checkout) throw new NotFoundException('Checkout not found.');

      if (checkout.status === CheckoutStatusValues.CONVERTED) {
        if (checkout.paymentIntentId === dto.paymentIntentId) return this.statusOf(checkout);
        this.logger.error(
          `complete REFUSED — checkout ${checkout.id} already paid by intent ${checkout.paymentIntentId}, second intent ${dto.paymentIntentId}`,
        );
        throw new ConflictException({
          label: 'Already Paid',
          detail: 'This checkout was already paid by another payment. Refund the duplicate.',
        });
      }
      if (checkout.paymentIntentId && checkout.paymentIntentId !== dto.paymentIntentId) {
        throw new ConflictException({
          label: 'Already Paid',
          detail: 'This checkout is bound to another payment.',
        });
      }

      const amount = BigInt(dto.amountMinor);
      if (amount !== checkout.totalAmount) {
        this.logger.error(
          `complete AMOUNT MISMATCH — checkout ${checkout.id} total ${checkout.totalAmount} ${checkout.currencyCode}, intent ${dto.paymentIntentId} paid ${amount}. Not converted.`,
        );
        throw new ConflictException({
          label: 'Amount Mismatch',
          detail: `The payment of ${amount} does not match the checkout total of ${checkout.totalAmount} (minor units).`,
        });
      }
      const currency = dto.currency.toUpperCase();
      if (currency !== checkout.currencyCode.toUpperCase()) {
        this.logger.error(
          `complete CURRENCY MISMATCH — checkout ${checkout.id} in ${checkout.currencyCode}, intent ${dto.paymentIntentId} paid in ${currency}. Not converted.`,
        );
        throw new ConflictException({
          label: 'Amount Mismatch',
          detail: `The payment in ${currency} does not match the checkout currency ${checkout.currencyCode}.`,
        });
      }

      // A payment that lands after the window closed still buys the goods; the orders carry a flag for staff
      const wasCancelled = checkout.status === CheckoutStatusValues.CANCELLED;
      const paidAt = new Date(dto.paidAt);
      await this.repository.update(checkout.id, {
        status: CheckoutStatusValues.PAID,
        paymentIntentId: dto.paymentIntentId,
        paidAt,
        ...(wasCancelled ? { cancelledAt: null, cancellationReason: null } : {}),
      });

      const lines = await this.repository.findLines(checkout.id);
      const orders: CheckoutOrderRefDto[] = [];
      for (const share of groupByStore(lines)) {
        await this.enterStore(share.siteId, share.legalEntityId);
        const order = await this.ordersService.createPaid({
          partyId: checkout.partyId,
          currencyCode: checkout.currencyCode,
          type: checkout.deliveryAddress ? OrderTypeValues.DELIVERY : OrderTypeValues.TAKEAWAY,
          customerName: checkout.customerName,
          customerPhone: checkout.customerPhone,
          deliveryAddress: checkout.deliveryAddress,
          notes: checkout.notes,
          lines: share.lines.map((line) => ({
            offeringId: line.offeringId,
            offeringVariantId: line.offeringVariantId,
            name: line.name,
            code: line.code,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
          checkoutId: checkout.id,
          paymentIntentId: dto.paymentIntentId,
          paidAt,
          paymentMethod: dto.method ?? null,
          paymentReference: dto.providerPaymentId ?? null,
          needsReview: wasCancelled,
        });
        // The paid-for quantities leave the store's cart; anything added since stays
        await this.cartsService.consumeOrderedLines(
          checkout.partyId,
          share.lines.map((line) => ({ code: line.code, quantity: line.quantity })),
        );
        orders.push({ siteId: share.siteId, orderId: order.id, orderNumber: order.orderNumber });
      }

      const converted = await this.repository.update(checkout.id, { status: CheckoutStatusValues.CONVERTED });
      if (wasCancelled) {
        this.logger.warn(
          `Checkout ${checkout.id} paid after cancellation — ${orders.length} order(s) flagged for review`,
        );
      } else {
        this.logger.log(`Checkout ${checkout.id} converted — ${orders.length} order(s), intent ${dto.paymentIntentId}`);
      }
      return CheckoutStatusDto.from(converted, lines, orders);
    });
  }

  // Abandons an unpaid checkout; one bound to another payment, or already paid, is left alone
  async cancel(dto: CancelCheckoutDto): Promise<CheckoutStatusDto> {
    return this.database.runInTransaction(async () => {
      const checkout = await this.repository.findByIdForUpdate(dto.checkoutId);
      if (!checkout) throw new NotFoundException('Checkout not found.');

      if (dto.paymentIntentId && checkout.paymentIntentId && checkout.paymentIntentId !== dto.paymentIntentId) {
        this.logger.warn(
          `cancel skipped — checkout ${checkout.id} is bound to intent ${checkout.paymentIntentId}, not ${dto.paymentIntentId}`,
        );
        return this.statusOf(checkout);
      }
      if (checkout.status !== CheckoutStatusValues.OPEN) return this.statusOf(checkout);

      const cancelled = await this.repository.update(checkout.id, {
        status: CheckoutStatusValues.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: dto.reason,
      });
      this.logger.log(`Unpaid checkout ${checkout.id} cancelled — ${dto.reason}`);
      return this.statusOf(cancelled);
    });
  }

  // Where a party's checkout stands, with the orders it has become — what a return page shows. Another party's is
  // not found
  async get(checkoutId: string, partyId: string): Promise<CheckoutStatusDto> {
    const checkout = await this.requireById(checkoutId);
    if (checkout.partyId !== partyId) throw new NotFoundException('Checkout not found.');
    return this.statusOf(checkout);
  }

  private async requireById(id: string): Promise<Checkout> {
    const checkout = await this.repository.findById(id);
    if (!checkout) throw new NotFoundException('Checkout not found.');
    return checkout;
  }

  private async statusOf(checkout: Checkout): Promise<CheckoutStatusDto> {
    const [lines, orders] = await Promise.all([
      this.repository.findLines(checkout.id),
      this.repository.findOrders(checkout.id),
    ]);
    return CheckoutStatusDto.from(checkout, lines, orders);
  }

  // Moves the rest of the transaction into one store, the way the request's own headers would have: the order stamps
  // its site from this, and the store's cart is only reachable under it. Transaction-local, so it ends with the commit
  private async enterStore(siteId: string, legalEntityId: string): Promise<void> {
    await this.database.drizzleClient.execute(
      sql`select set_config('app.site_id', ${siteId}, true), set_config('app.le_id', ${legalEntityId}, true)`,
    );
  }

  // The party's own address as the single line the orders carry
  private async resolveAddress(partyId: string, addressId: string): Promise<string> {
    const address = await this.addressesRepository.findById(addressId);
    if (!address || address.partyId !== partyId || !address.isActive) {
      throw new BadRequestException({
        label: 'Address Not Found',
        detail: 'Choose one of your saved delivery addresses.',
        errors: [{ field: 'addressId', message: 'Address not found' }],
      });
    }
    return [address.line1, address.line2, address.city, address.region, address.postalCode, address.countryCode]
      .filter((part): part is string => Boolean(part))
      .join(', ');
  }
}

// A cart line frozen for the checkout, with the store it was added at
function toFrozenLine(store: { siteId: string; legalEntityId: string }, row: CartItemRow) {
  const unitPrice = row.amount as bigint;
  return {
    siteId: store.siteId,
    legalEntityId: store.legalEntityId,
    offeringId: row.offeringId,
    offeringVariantId: row.offeringVariantId,
    name: variantLabel(row.offeringName ?? row.code, row.dimensions),
    code: row.code,
    quantity: row.quantity,
    unitPrice,
    lineTotal: unitPrice * BigInt(row.quantity),
  };
}

// The lines by store, stores in the order their first line was frozen
function groupByStore(lines: CheckoutLine[]): StoreShare[] {
  const shares = new Map<string, StoreShare>();
  for (const line of lines) {
    const share = shares.get(line.siteId) ?? { siteId: line.siteId, legalEntityId: line.legalEntityId, lines: [] };
    share.lines.push(line);
    shares.set(line.siteId, share);
  }
  return [...shares.values()];
}
