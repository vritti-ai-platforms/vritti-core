import { CartItemDto } from '@domain/carts/dto/entity/cart.dto';
import { CartsDomainService } from '@domain/carts/services/carts.service';
import {
  type CheckoutCustomerDto,
  CheckoutOrderDto,
  type OrderPaymentStatusDto,
} from '@domain/orders/dto/entity/order-checkout.dto';
import type { AwaitingPaymentOrderLine } from '@domain/orders/dto/request/awaiting-payment-order-input.dto';
import type { CreateOrderFromCartDto } from '@domain/orders/dto/request/create-order-from-cart.dto';
import type { MarkOrderPaidDto } from '@domain/orders/dto/request/mark-order-paid.dto';
import { OrdersDomainService } from '@domain/orders/services/orders.service';
import { PartiesDomainRepository } from '@domain/parties/repositories/parties.repository';
import { PartyAddressesDomainRepository } from '@domain/party-addresses/repositories/party-addresses.repository';
import { PartyCommunicationsDomainService } from '@domain/party-communications/services/party-communications.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type Order, OrderStatusValues, OrderTypeValues, PartyCommunicationChannelValues } from '@/db/schema';

// orders.customer_phone is varchar(20)
const CUSTOMER_PHONE_MAX = 20;

@Injectable()
export class SiteOrdersService {
  private readonly logger = new Logger(SiteOrdersService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly ordersService: OrdersDomainService,
    private readonly cartsService: CartsDomainService,
    private readonly partiesRepository: PartiesDomainRepository,
    private readonly addressesRepository: PartyAddressesDomainRepository,
    private readonly communicationsService: PartyCommunicationsDomainService,
  ) {}

  // Turns the shopper's basket at this site into an order awaiting payment.
  async createFromCart(dto: CreateOrderFromCartDto, siteId: string): Promise<CheckoutOrderDto> {
    const party = await this.partiesRepository.findById(dto.partyId);
    if (!party) throw new NotFoundException('Customer not found.');

    // Who is paying — returned with the order so the payment gateway's page comes prefilled
    const [phone, email] = await Promise.all([
      this.communicationsService.findPrimary(dto.partyId, PartyCommunicationChannelValues.PHONE),
      this.communicationsService.findPrimary(dto.partyId, PartyCommunicationChannelValues.EMAIL),
    ]);
    const customer: CheckoutCustomerDto = {
      name: party.displayName ?? null,
      phone: phone?.value ?? null,
      email: email?.value ?? null,
    };

    if (dto.idempotencyKey) {
      const existing = await this.ordersService.findCheckoutOrder(dto.partyId, dto.idempotencyKey, siteId);
      if (existing) return this.reuseCheckoutOrder(existing, dto.currencyCode, customer);
    }

    const checkout = await this.cartsService.findForCheckout(dto.partyId, dto.currencyCode, dto.appId);
    const priced = (checkout?.lines ?? []).map((row) => ({ row, view: CartItemDto.from(row) }));
    const available = priced.filter((line) => line.view.isAvailable);
    if (available.length === 0) {
      throw new BadRequestException({
        label: 'Cart Empty',
        detail: 'There is nothing in the basket that can be bought. Add a product before checking out.',
      });
    }

    const unavailable = priced.filter((line) => !line.view.isAvailable);
    if (unavailable.length > 0) {
      const names = unavailable.map((line) => line.view.name || line.view.code || line.row.offeringVariantId);
      throw new ConflictException({
        label: 'Cart Changed',
        detail: `${names.join(', ')} can no longer be bought. Review your basket before paying.`,
      });
    }

    const deliveryAddress = dto.addressId ? await this.resolveAddress(dto.partyId, dto.addressId) : null;

    const lines: AwaitingPaymentOrderLine[] = available.map(({ row }) => ({
      offeringId: row.offeringId,
      offeringVariantId: row.offeringVariantId,
      itemName: row.offeringName ?? row.variantName ?? '',
      variantName: row.variantName,
      code: row.code,
      quantity: row.quantity,
      unitPrice: row.amount as bigint,
    }));

    this.logger.log(`createFromCart — party: ${dto.partyId}, cart: ${checkout?.cartId}, lines: ${lines.length}`);
    return this.ordersService
      .createAwaitingPayment({
        partyId: dto.partyId,
        currencyCode: dto.currencyCode,
        type: deliveryAddress ? OrderTypeValues.DELIVERY : OrderTypeValues.TAKEAWAY,
        customerName: party.displayName,
        customerPhone: phone?.value.slice(0, CUSTOMER_PHONE_MAX) ?? null,
        deliveryAddress,
        notes: dto.notes ?? null,
        checkoutKey: dto.idempotencyKey ?? null,
        lines,
      })
      .then((order) => ({ ...order, customer }))
      .catch(async (error: unknown) => {
        // Two submits with the same key raced past the lookup above; the unique key lets one through, and the other
        // answers with the order that one opened
        if (!dto.idempotencyKey) throw error;
        const winner = await this.ordersService.findCheckoutOrder(dto.partyId, dto.idempotencyKey, siteId);
        if (!winner) throw error;
        return this.reuseCheckoutOrder(winner, dto.currencyCode, customer);
      });
  }

  // Answers a repeated checkout with the order its key already opened.
  private reuseCheckoutOrder(order: Order, currencyCode: string, customer: CheckoutCustomerDto): CheckoutOrderDto {
    if (order.status === OrderStatusValues.CANCELLED) {
      throw new ConflictException({
        label: 'Checkout Ended',
        detail: 'This checkout has ended without payment. Reload the page to check out again.',
      });
    }
    this.logger.log(`createFromCart — reusing order ${order.orderNumber} for the same checkout`);
    return CheckoutOrderDto.from(order, order.currencyCode ?? currencyCode, customer, true);
  }

  // Records the payment against this site's order and takes the paid lines out of the shopper's basket, in one
  // transaction
  async markPaid(dto: MarkOrderPaidDto, siteId: string): Promise<OrderPaymentStatusDto> {
    return this.database.runInTransaction(async () => {
      const { result, partyId, paidLines } = await this.ordersService.markPaid(dto, siteId);
      if (partyId && paidLines.length > 0) await this.cartsService.consumeOrderedLines(partyId, paidLines);
      return result;
    });
  }

  // The party's own address as the single line the order carries
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
