import { PaymentTermRulesDomainService } from '@domain/payment-term-rules/services/payment-term-rules.service';
import { PaymentTermsDomainService } from '@domain/payment-terms/services/payment-terms.service';
import { PurchaseOrderItemsDomainService } from '@domain/purchase-order-items/services/purchase-order-items.service';
import { PurchaseOrdersDomainService } from '@domain/purchase-orders/services/purchase-orders.service';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import type { SupplierInvoiceDto } from '@domain/supplier-invoices/dto/entity/supplier-invoice.dto';
import type { CreateSupplierInvoiceDto } from '@domain/supplier-invoices/dto/request/create-supplier-invoice.dto';
import type { ReleaseSupplierInvoiceHoldDto } from '@domain/supplier-invoices/dto/request/release-supplier-invoice-hold.dto';
import type { UpdateSupplierInvoiceDto } from '@domain/supplier-invoices/dto/request/update-supplier-invoice.dto';
import type { SupplierInvoiceRow } from '@domain/supplier-invoices/repositories/supplier-invoices.repository';
import { SupplierInvoiceHoldsDomainService } from '@domain/supplier-invoices/services/supplier-invoice-holds.service';
import { SupplierInvoicesDomainService } from '@domain/supplier-invoices/services/supplier-invoices.service';
import { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { UnauthorizedException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SupplierInvoiceStatusValues } from '@/db/schema';
import { PurchaseProgressService } from '@/modules/site/purchase-progress/services/purchase-progress.service';
import { SupplierInvoiceRecostingService } from './supplier-invoice-recosting.service';

export interface SupplierInvoiceSite {
  siteId?: string;
  leCurrencyCode: string;
}

@Injectable()
export class SupplierInvoicesService {
  private readonly logger = new Logger(SupplierInvoicesService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly invoicesService: SupplierInvoicesDomainService,
    private readonly holdsService: SupplierInvoiceHoldsDomainService,
    private readonly recostingService: SupplierInvoiceRecostingService,
    private readonly suppliersService: SuppliersDomainService,
    private readonly supplierEnrollmentsService: SupplierEnrollmentsDomainService,
    private readonly paymentTermsService: PaymentTermsDomainService,
    private readonly paymentTermRulesService: PaymentTermRulesDomainService,
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly purchaseOrderItemsService: PurchaseOrderItemsDomainService,
    private readonly purchasesService: PurchasesDomainService,
    private readonly purchaseProgressService: PurchaseProgressService,
  ) {}

  // Records a draft invoice of a supplier enrolled at the site, on the enrollment's payment term and due by it
  async create(
    dto: CreateSupplierInvoiceDto,
    site: SupplierInvoiceSite,
  ): Promise<CreateResponseDto<SupplierInvoiceDto>> {
    const supplier = await this.suppliersService.findByIdOrThrow(dto.supplierId);
    const enrollment = await this.supplierEnrollmentsService.findBySupplierAndSiteOrThrow(supplier.id, site.siteId);
    const paymentTerm = await this.paymentTermsService.findByIdOrThrow(enrollment.paymentTermId);
    const dueDate = await this.paymentTermRulesService.findFinalDueDate(paymentTerm, dto.invoiceDate);

    this.logger.log(`supplierInvoices.create — supplier: ${supplier.id}, site: ${enrollment.siteId}, due: ${dueDate}`);
    return this.invoicesService.create(dto, {
      siteId: site.siteId,
      leCurrencyCode: site.leCurrencyCode,
      supplierCurrencyCode: supplier.currencyCode,
      supplierCurrencyCodes: supplier.currencyCodes,
      paymentTermId: paymentTerm.id,
      dueDate,
    });
  }

  // Updates an invoice's header, moving its due date with its date under its payment term; a posted one is re-costed at
  // the edited rate and its holds are recomputed, in one transaction
  async update(dto: UpdateSupplierInvoiceDto, leCurrencyCode: string): Promise<SuccessResponseDto> {
    const invoice = await this.invoicesService.findEditableOrThrow(dto.id);
    this.assertNotReceiveWithInvoiceDraft(invoice);
    const paymentTerm = await this.paymentTermsService.findByIdOrThrow(invoice.paymentTermId);
    const dueDate = await this.paymentTermRulesService.findFinalDueDate(
      paymentTerm,
      dto.invoiceDate ?? invoice.invoiceDate,
    );
    await this.invoicesService.assertUpdatable(invoice, dto, leCurrencyCode);
    return this.database.runInTransaction(async () => {
      const result = await this.recostingService.withPostedCosting(invoice, leCurrencyCode, () =>
        this.invoicesService.update(invoice, dto, dueDate),
      );
      await this.holdsService.sync(invoice.id, leCurrencyCode);
      return result;
    });
  }

  // Posts a draft, settling the cost of the stock it invoices, landing its charges, computing its holds and moving its PO
  // lines' invoiced counters, and tells the purchases it invoices, in one transaction; a Receive with Invoice posts with its receipts
  async post(id: string, leCurrencyCode: string, postedBy: string | null): Promise<SuccessResponseDto> {
    const invoice = await this.invoicesService.findDraftOrThrow(id, 'post');
    this.assertNotReceiveWithInvoiceDraft(invoice);
    await this.invoicesService.assertPostable(invoice, leCurrencyCode);
    await this.database.runInTransaction(async () => {
      await this.postDraft(invoice, leCurrencyCode, postedBy);
      await this.purchaseProgressService.notifyInvoice(invoice);
    });
    return { success: true, message: `Invoice "${invoice.invoiceNumber}" posted.` };
  }

  // Posts a checked draft: settles the cost of the stock it invoices, lands its charges, computes its holds and moves its
  // PO lines' invoiced counters, in the caller's transaction
  async postDraft(invoice: SupplierInvoiceRow, leCurrencyCode: string, postedBy: string | null): Promise<void> {
    await this.invoicesService.post(invoice, postedBy);
    await this.recostingService.revalue(invoice, leCurrencyCode, 'apply');
    await this.holdsService.sync(invoice.id, leCurrencyCode);
    await this.moveInvoicing(invoice.id, 'apply');
  }

  // Cancels a draft or posted invoice; a posted one's PO line invoiced counters, costing and charges are reversed, and the
  // purchases it invoices are told, in one transaction
  async cancel(id: string, leCurrencyCode: string): Promise<SuccessResponseDto> {
    const invoice = await this.invoicesService.findEditableOrThrow(id);
    this.assertNotReceiveWithInvoiceDraft(invoice);
    await this.database.runInTransaction(async () => {
      if (invoice.status === SupplierInvoiceStatusValues.POSTED) {
        await this.moveInvoicing(invoice.id, 'reverse');
        await this.recostingService.revalue(invoice, leCurrencyCode, 'reverse');
      }
      await this.invoicesService.cancel(invoice);
      await this.purchaseProgressService.notifyInvoice(invoice);
    });
    return { success: true, message: `Invoice "${invoice.invoiceNumber}" cancelled.` };
  }

  // Releases an open hold of an invoice that is not cancelled, recording the releasing user
  async releaseHold(dto: ReleaseSupplierInvoiceHoldDto, userId: string): Promise<SuccessResponseDto> {
    if (!userId) throw new UnauthorizedException('A signed-in user is required to release a hold.');
    const invoice = await this.invoicesService.findEditableOrThrow(dto.supplierInvoiceId);
    return this.holdsService.release(invoice, dto, userId);
  }

  // Runs a change to an invoice's lines in the caller's transaction: a posted invoice's PO line invoiced counters and stock
  // costing are taken back before the change and applied again after it, and the invoice's holds are recomputed
  async changeLines<T>(invoice: SupplierInvoiceRow, leCurrencyCode: string, change: () => Promise<T>): Promise<T> {
    this.assertNotReceiveWithInvoiceDraft(invoice);
    return this.withPostedInvoicing(invoice, async () => {
      const result = await this.recostingService.withPostedCosting(invoice, leCurrencyCode, change);
      await this.holdsService.sync(invoice.id, leCurrencyCode);
      return result;
    });
  }

  // Rejects a change to a draft Receive with Invoice, which is edited, posted and discarded with its receipts (409)
  assertNotReceiveWithInvoiceDraft(invoice: SupplierInvoiceRow): void {
    if (!invoice.isReceiveWithInvoice || invoice.status !== SupplierInvoiceStatusValues.DRAFT) return;
    this.purchasesService.assertNotPartOfPurchase(
      `Invoice "${invoice.invoiceNumber}"`,
      invoice.purchases.map((purchase) => purchase.purchaseNumber),
    );
  }

  // Deletes a draft invoice
  async delete(id: string): Promise<SuccessResponseDto> {
    const invoice = await this.invoicesService.findDraftOrThrow(id, 'delete');
    this.assertNotReceiveWithInvoiceDraft(invoice);
    return this.invoicesService.delete(invoice);
  }

  // Runs a change in the caller's transaction; a posted invoice's PO line invoiced counters are taken back before the
  // change and moved again after it
  private async withPostedInvoicing<T>(invoice: SupplierInvoiceRow, change: () => Promise<T>): Promise<T> {
    if (invoice.status !== SupplierInvoiceStatusValues.POSTED) return change();
    await this.moveInvoicing(invoice.id, 'reverse');
    const result = await change();
    await this.moveInvoicing(invoice.id, 'apply');
    return result;
  }

  // Moves the invoiced counters of the PO lines an invoice invoices, then those orders' statuses
  private async moveInvoicing(supplierInvoiceId: string, direction: 'apply' | 'reverse'): Promise<void> {
    const moves = await this.invoicesService.findInvoicingMoves(supplierInvoiceId);
    await this.purchaseOrderItemsService.applyInvoicing(moves, direction);
    await this.purchaseOrdersService.syncProgressOfItems(moves.map((move) => move.purchaseOrderItemId));
  }
}
