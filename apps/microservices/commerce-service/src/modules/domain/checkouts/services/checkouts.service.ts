import { createHash } from 'node:crypto';
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
  CancelCheckoutDto,
  ChangeCheckoutAddressDto,
  ChangeCheckoutContactDto,
  CompleteCheckoutDto,
  FindOpenCheckoutDto,
  StartCheckoutDto,
} from '../dto/request/checkout-request.dto';
import { CheckoutsDomainRepository } from '../repositories/checkouts.repository';

// How long the shopper has to pay; every payment intent opened for the checkout is given the same deadline
const CHECKOUT_TTL_MS = 10 * 60 * 1000;
const EXPIRE_BATCH = 100;
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

  // Freezes the shopper's carts at the chosen stores into one checkout. No payment is opened here: a payment intent is
  // created for the checkout when the shopper presses Pay, and a checkout may have several (a retry, another gateway)
  // until one of them pays it
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

    if (dto.addressId) await this.assertAddress(dto.partyId, dto.addressId);
    const lines = available.map(({ store, row }) => toFrozenLine(store, row));
    const totalAmount = lines.reduce((sum, line) => sum + line.lineTotal, 0n);

    // The cart's fingerprint: the same cart reaches the same open checkout, any edit makes a new one
    const checkoutKey = cartFingerprint(dto.currencyCode, lines);

    this.logger.log(`checkouts.start — party: ${dto.partyId}, stores: ${carts.length}, lines: ${lines.length}`);
    return this.database.runInTransaction(async () => {
      // One start per party at a time, so two presses cannot both find no open checkout
      await this.repository.lockParty(dto.partyId);
      const now = new Date();
      await this.repository.expireStaleForParty(dto.partyId, now);

      const open = await this.repository.findOpenByParty(dto.partyId);
      // The same cart: the checkout already open for it, with its own timer, address and contact
      if (open && open.checkoutKey === checkoutKey) {
        this.logger.log(`checkouts.start — reusing open checkout ${open.id} for the same cart`);
        return CheckoutStartedDto.from(
          open,
          await this.repository.findLines(open.id),
          { name: open.customerName, phone: open.customerPhone, email: open.customerEmail },
          true,
        );
      }
      // A different cart: the open checkout is replaced, but only the one core cleared (no payment under way, none
      // paid at its gateway). Any other means it changed since core looked
      if (open && open.id !== dto.replaceCheckoutId) {
        throw new ConflictException({
          label: 'Checkout In Progress',
          detail: 'You have another checkout open. Reload the page and check out again.',
        });
      }
      if (open) {
        await this.repository.update(open.id, { status: CheckoutStatusValues.CANCELLED, expiresAt: now });
      }

      const checkout = await this.repository.create({
        appId: dto.appId,
        partyId: dto.partyId,
        currencyCode: dto.currencyCode,
        totalAmount,
        partyAddressId: dto.addressId ?? null,
        checkoutKey,
        customerName: party.displayName ?? null,
        customerPhone: phone?.value.slice(0, CUSTOMER_PHONE_MAX) ?? null,
        customerEmail: email?.value ?? null,
        expiresAt: new Date(now.getTime() + CHECKOUT_TTL_MS),
      });
      if (open) {
        await this.repository.update(open.id, { replacedByCheckoutId: checkout.id });
        this.logger.log(`checkouts.start — checkout ${open.id} replaced by ${checkout.id} (the cart changed)`);
      }
      const frozen = await this.repository.createLines(lines.map((line) => ({ ...line, checkoutId: checkout.id })));
      return CheckoutStartedDto.from(checkout, frozen, customer);
    });
  }

  // The party's open checkout, if its window is still open — what core checks before a new one replaces it, and what
  // the storefront's "checkout in progress" card shows
  async findOpen(dto: FindOpenCheckoutDto): Promise<{ checkout: CheckoutStatusDto | null }> {
    const open = await this.repository.findOpenByParty(dto.partyId);
    if (!open || open.expiresAt.getTime() <= Date.now()) return { checkout: null };
    return { checkout: CheckoutStatusDto.from(open, await this.repository.findLines(open.id), []) };
  }

  // Expires the open checkouts whose window closed unpaid. A checkout ends only by its own deadline: one payment
  // intent ending says nothing about it, since another may still be open
  async expireStale(limit = EXPIRE_BATCH): Promise<{ cancelled: number }> {
    const now = new Date();
    const candidates = await this.repository.findExpired(now, limit);
    let cancelled = 0;
    for (const candidate of candidates) {
      const done = await this.database.runInTransaction(async () => {
        const checkout = await this.repository.findByIdForUpdate(candidate.id);
        // Re-read under the lock: a payment may have landed between the scan and here
        if (!checkout || checkout.status !== CheckoutStatusValues.OPEN || checkout.expiresAt >= now) return false;
        await this.repository.update(checkout.id, {
          // Expired, not cancelled: nobody ended it, its window closed (expires_at says when)
          status: CheckoutStatusValues.EXPIRED,
        });
        return true;
      });
      if (done) cancelled++;
    }
    if (cancelled > 0) this.logger.log(`Expired ${cancelled} unpaid checkout(s)`);
    return { cancelled };
  }

  // Records the captured payment and turns the checkout into one paid order per store, all in one transaction.
  // Idempotent per payment intent
  async complete(dto: CompleteCheckoutDto): Promise<CheckoutStatusDto> {
    return this.database.runInTransaction(async () => {
      const checkout = await this.repository.findByIdForUpdate(dto.checkoutId);
      if (!checkout) throw new NotFoundException('Checkout not found.');

      // Paid already: by this payment intent (a repeat — answer as before), or by another one, whose money core refunds
      if (checkout.status === CheckoutStatusValues.CONVERTED || checkout.status === CheckoutStatusValues.PAID) {
        const lines = await this.repository.findLines(checkout.id);
        if (lines[0]) await this.enterStore(lines[0].siteId, lines[0].legalEntityId);
        const paidBy = await this.repository.findPaidPaymentIntentIds(checkout.id);
        if (paidBy.includes(dto.paymentIntentId)) {
          return CheckoutStatusDto.from(checkout, lines, await this.repository.findOrders(checkout.id));
        }
        this.logger.error(
          `complete REFUSED — checkout ${checkout.id} already paid by ${paidBy.join(', ') || 'another payment'}, second intent ${dto.paymentIntentId}`,
        );
        throw new ConflictException({
          label: 'Already Paid',
          detail: 'This checkout was already paid by another payment. Refund the duplicate.',
        });
      }

      // Replaced by a newer checkout before this payment landed: the party moved on to the newer cart, so the payment is
      // refused, and core refunds it in full. A checkout cancelled any other way still becomes its orders (below)
      if (checkout.replacedByCheckoutId) {
        this.logger.error(
          `complete REFUSED — checkout ${checkout.id} was replaced by ${checkout.replacedByCheckoutId}; intent ${dto.paymentIntentId} paid it late`,
        );
        throw new ConflictException({
          label: 'Checkout Replaced',
          detail: 'This checkout was replaced by a newer one before its payment landed. Refund the payment.',
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
      const wasCancelled =
        checkout.status === CheckoutStatusValues.CANCELLED || checkout.status === CheckoutStatusValues.EXPIRED;
      // The window closed when the money landed; status PAID says that is what the time means
      const paidAt = new Date(dto.paidAt);
      await this.repository.update(checkout.id, { status: CheckoutStatusValues.PAID, expiresAt: paidAt });

      const lines = await this.repository.findLines(checkout.id);
      // The address as it stands now, read once for every store's order
      const deliveryAddress = await this.deliveryAddressOf(checkout);
      const orders: CheckoutOrderRefDto[] = [];
      for (const share of groupByStore(lines)) {
        await this.enterStore(share.siteId, share.legalEntityId);
        const order = await this.ordersService.createPaid({
          partyId: checkout.partyId,
          currencyCode: checkout.currencyCode,
          type: deliveryAddress ? OrderTypeValues.DELIVERY : OrderTypeValues.TAKEAWAY,
          customerName: checkout.customerName,
          customerPhone: checkout.customerPhone,
          deliveryAddress,
          notes: null,
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
          needsReview: wasCancelled,
        });
        // The paid-for quantities leave the store's cart; anything added since stays
        await this.cartsService.consumeOrderedLines(
          checkout.partyId,
          share.lines.map((line) => ({ code: line.code, quantity: line.quantity })),
        );
        orders.push({
          siteId: share.siteId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentIntentId: dto.paymentIntentId,
        });
      }

      const converted = await this.repository.update(checkout.id, { status: CheckoutStatusValues.CONVERTED });
      if (wasCancelled) {
        this.logger.warn(
          `Checkout ${checkout.id} paid after it ${checkout.status === CheckoutStatusValues.EXPIRED ? 'expired' : 'was cancelled'} — ${orders.length} order(s) flagged for review`,
        );
      } else {
        this.logger.log(`Checkout ${checkout.id} converted — ${orders.length} order(s), intent ${dto.paymentIntentId}`);
      }
      return CheckoutStatusDto.from(converted, lines, orders);
    });
  }

  // Abandons an unpaid checkout. A payment intent's own expiry or cancellation no longer ends its checkout — another
  // payment may still be open — so a cancel naming a payment intent is acknowledged and ignored; the checkout ends by its
  // deadline (expireStale)
  async cancel(dto: CancelCheckoutDto): Promise<CheckoutStatusDto> {
    return this.database.runInTransaction(async () => {
      const checkout = await this.repository.findByIdForUpdate(dto.checkoutId);
      if (!checkout) throw new NotFoundException('Checkout not found.');
      const lines = await this.repository.findLines(checkout.id);

      if (dto.paymentIntentId) {
        this.logger.log(
          `cancel ignored — checkout ${checkout.id}: payment ${dto.paymentIntentId} ended (${dto.reason})`,
        );
        return CheckoutStatusDto.from(checkout, lines, []);
      }
      if (checkout.status !== CheckoutStatusValues.OPEN) return CheckoutStatusDto.from(checkout, lines, []);

      // The window closes now rather than at its deadline; the status says the shopper closed it
      const cancelled = await this.repository.update(checkout.id, {
        status: CheckoutStatusValues.CANCELLED,
        expiresAt: new Date(),
      });
      this.logger.log(`Unpaid checkout ${checkout.id} cancelled — ${dto.reason}`);
      return CheckoutStatusDto.from(cancelled, lines, []);
    });
  }

  // Delivers one of the party's open checkouts to another of their saved addresses — the same checkout, its window
  // unchanged. Its orders, made once it is paid, go to the address it holds then
  async changeAddress(dto: ChangeCheckoutAddressDto): Promise<CheckoutStatusDto> {
    return this.updateOpen(dto.checkoutId, dto.partyId, async () => {
      await this.assertAddress(dto.partyId, dto.addressId);
      return { partyAddressId: dto.addressId };
    });
  }

  // Changes who an open checkout's orders are for: the name, phone and email it holds. The party's profile is not
  // touched — this is for this order only
  async changeContact(dto: ChangeCheckoutContactDto): Promise<CheckoutStatusDto> {
    return this.updateOpen(dto.checkoutId, dto.partyId, async () => ({
      customerName: dto.name.trim(),
      customerPhone: dto.phone,
      customerEmail: dto.email?.trim() || null,
    }));
  }

  // Changes an open checkout under its row lock, so a payment completing at the same moment sees either the old or
  // the new values, never half of each. A checkout paid, ended or past its window is refused
  private async updateOpen(
    checkoutId: string,
    partyId: string,
    change: () => Promise<Partial<Checkout>>,
  ): Promise<CheckoutStatusDto> {
    return this.database.runInTransaction(async () => {
      const checkout = await this.repository.findByIdForUpdate(checkoutId);
      if (!checkout || checkout.partyId !== partyId) throw new NotFoundException('Checkout not found.');
      if (checkout.status !== CheckoutStatusValues.OPEN || checkout.expiresAt.getTime() <= Date.now()) {
        throw new ConflictException({
          label: 'Checkout Closed',
          detail: 'This checkout can no longer be changed. Check out again from your cart.',
        });
      }
      const updated = await this.repository.update(checkout.id, await change());
      return CheckoutStatusDto.from(updated, await this.repository.findLines(checkout.id), []);
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

  // The checkout with its lines and, once converted, its orders. Orders carry store-level read policies, so they are
  // read inside a transaction moved into one of the checkout's stores; the organization policy then shows them all
  private async statusOf(checkout: Checkout): Promise<CheckoutStatusDto> {
    const lines = await this.repository.findLines(checkout.id);
    if (checkout.status !== CheckoutStatusValues.CONVERTED || !lines[0]) {
      return CheckoutStatusDto.from(checkout, lines, []);
    }
    const first = lines[0];
    const orders = await this.database.runInTransaction(async () => {
      await this.enterStore(first.siteId, first.legalEntityId);
      return this.repository.findOrders(checkout.id);
    });
    return CheckoutStatusDto.from(checkout, lines, orders);
  }

  // Moves the rest of the transaction into one store, the way the request's own headers would have: the order stamps
  // its site from this, and the store's cart is only reachable under it. Transaction-local, so it ends with the commit
  private async enterStore(siteId: string, legalEntityId: string): Promise<void> {
    await this.database.drizzleClient.execute(
      sql`select set_config('app.site_id', ${siteId}, true), set_config('app.le_id', ${legalEntityId}, true)`,
    );
  }

  // Refuses an address that is not one of the party's own, live ones
  private async assertAddress(partyId: string, addressId: string): Promise<void> {
    const address = await this.addressesRepository.findById(addressId);
    if (!address || address.partyId !== partyId || !address.isActive) {
      throw new BadRequestException({
        label: 'Address Not Found',
        detail: 'Choose one of your saved delivery addresses.',
        errors: [{ field: 'addressId', message: 'Address not found' }],
      });
    }
  }

  // The checkout's delivery address as one text, for the orders it becomes — the saved address as it stands now, even
  // if the party has since retired it, since it is the one they chose. None when the checkout is for takeaway, or the
  // address row is gone
  private async deliveryAddressOf(checkout: Checkout): Promise<string | null> {
    if (!checkout.partyAddressId) return null;
    const address = await this.addressesRepository.findById(checkout.partyAddressId);
    if (!address) return null;
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

// The cart's fingerprint: a hash of the currency and every frozen line — its store, variant, quantity and price —
// order-independent. The same cart gives the same key; any edit gives a new one
function cartFingerprint(
  currencyCode: string,
  lines: { siteId: string; offeringVariantId: string; quantity: number; unitPrice: bigint }[],
): string {
  const parts = lines
    .map((line) => `${line.siteId}:${line.offeringVariantId}:${line.quantity}:${line.unitPrice}`)
    .sort();
  return createHash('sha256')
    .update([currencyCode.toUpperCase(), ...parts].join('|'))
    .digest('hex');
}
