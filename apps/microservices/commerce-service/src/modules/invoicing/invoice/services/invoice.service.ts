import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, NotFoundException, SuccessResponseDto } from '@vritti/api-sdk';
import type { InvoiceLineItem, InvoiceStatus } from '@/db/schema';
import { OrderItemRepository } from '../.././../orders/order/repositories/order-item.repository';
import { OrderRepository } from '../../../orders/order/repositories/order.repository';
import { InvoiceDto } from '../dto/entity/invoice.dto';
import { InvoiceRepository } from '../repositories/invoice.repository';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
  ) {}

  // Generates an invoice from an order snapshot, rejecting if one already exists
  async generate(orderId: string): Promise<InvoiceDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundException('Order not found.');

    const existing = await this.invoiceRepository.findByOrderId(orderId);
    if (existing) {
      throw new BadRequestException({
        label: 'Invoice Exists',
        detail: `An invoice (${existing.invoiceNumber}) already exists for this order.`,
      });
    }

    const orderItems = await this.orderItemRepository.findByOrderId(orderId);

    // Build line items snapshot
    const lineItems: InvoiceLineItem[] = orderItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    }));

    const invoiceNumber = await this.invoiceRepository.generateInvoiceNumber(
      order.organizationId,
      order.businessUnitId,
    );

    const invoice = await this.invoiceRepository.create({
      organizationId: order.organizationId,
      businessUnitId: order.businessUnitId,
      orderId: order.id,
      invoiceNumber,
      customerId: order.customerId ?? null,
      customerPhone: order.customerPhone ?? null,
      items: lineItems,
      subtotal: order.subtotal,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
      status: 'DRAFT',
      issuedAt: null,
      paidAt: null,
    });

    this.logger.log(`Generated invoice ${invoiceNumber} for order ${order.orderNumber}`);
    return InvoiceDto.from(invoice);
  }

  // Returns all invoices for an org+bu
  async findAll(orgId: string, buId: string): Promise<InvoiceDto[]> {
    const invoices = await this.invoiceRepository.findByOrgAndBu(orgId, buId);
    return invoices.map(InvoiceDto.from);
  }

  // Returns a single invoice by ID
  async findById(id: string): Promise<InvoiceDto> {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) throw new NotFoundException('Invoice not found.');
    return InvoiceDto.from(invoice);
  }

  // Updates the invoice status with timestamp tracking
  async updateStatus(id: string, status: string): Promise<SuccessResponseDto> {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) throw new NotFoundException('Invoice not found.');

    const updateData: Record<string, unknown> = { status: status as InvoiceStatus };

    // Track timestamp transitions
    if (status === 'ISSUED' && !invoice.issuedAt) {
      updateData.issuedAt = new Date();
    }
    if (status === 'PAID' && !invoice.paidAt) {
      updateData.paidAt = new Date();
    }

    await this.invoiceRepository.update(id, updateData);

    this.logger.log(`Updated invoice ${invoice.invoiceNumber} status to ${status}`);
    return { success: true, message: 'Invoice status updated successfully.' };
  }
}
