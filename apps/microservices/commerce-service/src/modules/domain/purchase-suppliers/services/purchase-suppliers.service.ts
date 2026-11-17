import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import type { TableState } from '@vritti/api-sdk/data-table';
import Decimal from '@vritti/api-sdk/decimal';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, ForbiddenException } from '@vritti/api-sdk/exceptions';
import {
  PurchaseLegStatusValues,
  type PurchaseLegStep,
  PurchaseLegStepValues,
  type PurchaseOrderStatus,
  PurchaseOrderStatusValues,
  PurchaseStatusValues,
  type PurchaseSupplier,
  type PurchaseType,
  PurchaseTypeValues,
  parties,
  purchaseSuppliers,
} from '@/db/schema';
import {
  type PurchaseLegAction,
  PurchaseLegActionValues,
  PurchaseLegStepLabels,
  PurchaseTypeLabels,
} from '../dto/entity/purchase-supplier.dto';
import type { LegEnrollmentSnapshot, LegPurchase } from '../repositories/purchase-suppliers.repository';
import {
  type PurchaseLegCount,
  type PurchaseSupplierRow,
  PurchaseSuppliersDomainRepository,
  type PurchaseSupplierTableRow,
} from '../repositories/purchase-suppliers.repository';

export type Leg = Pick<PurchaseSupplier, 'id' | 'type' | 'step' | 'status'>;

export interface LegSourcing {
  currencyCodes: string[];
  total: bigint | null;
  unpricedCount: number;
}

export interface LegStart {
  snapshot: LegEnrollmentSnapshot | undefined;
  sourcing: LegSourcing;
  leCurrencyCode: string;
  submittedBy: string | null;
}

export interface LegApprovers {
  userId: string | null;
  approverUserIds: string[];
  submitterId: string | null;
}

export interface LegAllocationQuantity {
  primaryUomQty: number;
  freePrimaryQty: number;
  purchaseOrderItemId: string | null;
}

export interface LegOrderLine {
  purchaseOrderStatus: PurchaseOrderStatus;
  primaryUomQty: number;
  freePrimaryQty: number;
  cancelledPrimaryQty: number;
  receivedPrimaryQty: number;
  returnedPrimaryQty: number;
  invoicedPrimaryQty: number;
  remainingToDeliverPrimaryQty: number;
}

export interface LegFulfilmentFacts {
  allocations: LegAllocationQuantity[];
  purchaseOrderStatuses: PurchaseOrderStatus[];
  orderLines: LegOrderLine[];
  hasReceivableAnnouncedDelivery: boolean;
  hasDraftReceipt: boolean;
  hasDraftInvoice: boolean;
  hasDeliveryOnTheWay: boolean;
  hasPostedDocument: boolean;
  receivingClosed: boolean;
  invoiceablePrimaryQty: number;
}

export interface LegBlockers {
  cancel: string | null;
  close: string | null;
}

export interface LegProgress {
  duePrimaryQty: number;
  orderedPrimaryQty: number;
  receivedPrimaryQty: number;
  invoicedPrimaryQty: number;
}

export interface LegAdvance {
  stepBefore: PurchaseLegStep;
  stepAfter: PurchaseLegStep;
  isClosed: boolean;
}

interface LegQuantities {
  due: Decimal;
  ordered: Decimal;
  received: Decimal;
  returned: Decimal;
  invoiced: Decimal;
  unordered: Decimal;
  remainingToDeliver: Decimal;
  openOnConfirmed: Decimal;
}

@Injectable()
export class PurchaseSuppliersDomainService {
  private readonly logger = new Logger(PurchaseSuppliersDomainService.name);

  private static readonly FIRST_FULFILMENT_STEP: Record<PurchaseType, PurchaseLegStep> = {
    [PurchaseTypeValues.DIRECT_PURCHASE]: PurchaseLegStepValues.RECEIVE_WITH_INVOICE,
    [PurchaseTypeValues.DIRECT_RECEIPT]: PurchaseLegStepValues.GOODS_RECEIPT,
    [PurchaseTypeValues.ORDER_INVOICE_WITH_GOODS]: PurchaseLegStepValues.PURCHASE_ORDER,
    [PurchaseTypeValues.STANDARD]: PurchaseLegStepValues.PURCHASE_ORDER,
    [PurchaseTypeValues.ANNOUNCED]: PurchaseLegStepValues.PURCHASE_ORDER,
    [PurchaseTypeValues.PREPAID]: PurchaseLegStepValues.PURCHASE_ORDER,
    [PurchaseTypeValues.SELF_INVOICING]: PurchaseLegStepValues.PURCHASE_ORDER,
  };

  private static readonly UNPRICED_TYPES: PurchaseType[] = [
    PurchaseTypeValues.DIRECT_PURCHASE,
    PurchaseTypeValues.DIRECT_RECEIPT,
  ];

  private static readonly FULFILLED_TYPES: PurchaseType[] = [
    PurchaseTypeValues.DIRECT_PURCHASE,
    PurchaseTypeValues.DIRECT_RECEIPT,
    PurchaseTypeValues.ORDER_INVOICE_WITH_GOODS,
    PurchaseTypeValues.STANDARD,
    PurchaseTypeValues.ANNOUNCED,
  ];

  private static readonly ORDER_TYPES: PurchaseType[] = [
    PurchaseTypeValues.ORDER_INVOICE_WITH_GOODS,
    PurchaseTypeValues.STANDARD,
    PurchaseTypeValues.ANNOUNCED,
  ];

  static readonly RECEIVE_WITH_INVOICE_TYPES: PurchaseType[] = [
    PurchaseTypeValues.DIRECT_PURCHASE,
    PurchaseTypeValues.ORDER_INVOICE_WITH_GOODS,
  ];

  static readonly SUPPLIER_INVOICE_TYPES: PurchaseType[] = [
    PurchaseTypeValues.DIRECT_RECEIPT,
    PurchaseTypeValues.STANDARD,
    PurchaseTypeValues.ANNOUNCED,
  ];

  private static readonly NOT_FULFILLING_STEPS: PurchaseLegStep[] = [
    PurchaseLegStepValues.SOURCING,
    PurchaseLegStepValues.APPROVAL,
    PurchaseLegStepValues.CLOSED,
  ];

  private static readonly ACTION_LABELS: Partial<Record<PurchaseLegAction, string>> = {
    [PurchaseLegActionValues.CREATE_PURCHASE_ORDER]: 'Cannot Create Purchase Order',
    [PurchaseLegActionValues.CONFIRM_PURCHASE_ORDER]: 'Cannot Confirm Purchase Order',
    [PurchaseLegActionValues.CREATE_INBOUND_DELIVERY]: 'Cannot Create Inbound Delivery',
    [PurchaseLegActionValues.CREATE_GOODS_RECEIPT]: 'Cannot Create Goods Receipt',
    [PurchaseLegActionValues.RECEIVE_WITH_INVOICE]: 'Cannot Receive with Invoice',
    [PurchaseLegActionValues.CREATE_SUPPLIER_INVOICE]: 'Cannot Create Supplier Invoice',
    [PurchaseLegActionValues.CLOSE_SUPPLIER]: 'Cannot Close Supplier',
    [PurchaseLegActionValues.CANCEL_SUPPLIER]: 'Cannot Cancel Supplier',
  };

  private static readonly TABLE_FIELD_MAP: FieldMap = {
    step: { column: purchaseSuppliers.step, type: 'string' },
    status: { column: purchaseSuppliers.status, type: 'string' },
    supplierId: { column: purchaseSuppliers.supplierId, type: 'string' },
    supplierName: { column: parties.displayName, type: 'string' },
    submittedAt: { column: purchaseSuppliers.submittedAt, type: 'string' },
  };

  constructor(private readonly repository: PurchaseSuppliersDomainRepository) {}

  // Opens the leg of a supplier on an open purchase, with a snapshot of its active enrollment at the site
  async open(
    purchase: LegPurchase,
    supplierId: string,
    snapshot: LegEnrollmentSnapshot | undefined,
  ): Promise<PurchaseSupplier> {
    this.repository.assertPurchaseOpen(purchase, 'Cannot Allocate');
    const enrollment = this.repository.requireActiveEnrollment(snapshot);
    const leg = await this.repository.create({
      purchaseId: purchase.id,
      supplierId,
      supplierEnrollmentId: enrollment.enrollmentId,
      type: enrollment.purchaseType,
      approvalEnabled: enrollment.approvalEnabled,
      approvalThreshold: enrollment.approvalThreshold,
      qualityCheckEnabled: enrollment.qualityCheckEnabled,
    });
    this.logger.log(`Opened leg ${leg.id} for supplier ${supplierId} on purchase ${purchase.purchaseNumber}`);
    return leg;
  }

  // Starts a leg in sourcing: copies its enrollment again, then sends it to APPROVAL when its approval applies and to
  // its type's first fulfilment step otherwise, clearing its last rejection; returns the step it reached
  async start(leg: Leg, start: LegStart): Promise<PurchaseLegStep> {
    this.assertInSourcing(leg, 'Cannot Submit Supplier');
    const enrollment = this.repository.requireActiveEnrollment(start.snapshot);
    if (start.sourcing.unpricedCount > 0 && !this.allowsUnpriced(enrollment.purchaseType)) {
      throw new BadRequestException({
        label: 'Prices Missing',
        detail: `Enter a unit price on every allocation of this supplier; only direct purchases are priced by their supplier invoice.`,
      });
    }
    const step = this.requiresApproval(enrollment, start.sourcing, start.leCurrencyCode)
      ? PurchaseLegStepValues.APPROVAL
      : PurchaseSuppliersDomainService.FIRST_FULFILMENT_STEP[enrollment.purchaseType];
    await this.repository.update(leg.id, {
      supplierEnrollmentId: enrollment.enrollmentId,
      type: enrollment.purchaseType,
      approvalEnabled: enrollment.approvalEnabled,
      approvalThreshold: enrollment.approvalThreshold,
      qualityCheckEnabled: enrollment.qualityCheckEnabled,
      step,
      submittedAt: new Date(),
      submittedBy: start.submittedBy,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      rejectedAt: null,
      rejectedBy: null,
    });
    this.logger.log(`Started leg ${leg.id} → ${step}`);
    return step;
  }

  // Approves a leg waiting for approval, moving it to its type's first fulfilment step; returns that step
  async approve(leg: Leg, approvers: LegApprovers): Promise<PurchaseLegStep> {
    this.assertAwaitingApproval(leg, 'Cannot Approve');
    if (!this.mayApprove(approvers)) {
      throw new ForbiddenException({
        label: 'Cannot Approve',
        detail: this.isApprover(approvers)
          ? 'You submitted this supplier, so another approver has to approve it.'
          : "Only the approvers on the supplier's enrollment at this site can approve it.",
      });
    }
    const step = PurchaseSuppliersDomainService.FIRST_FULFILMENT_STEP[leg.type];
    await this.repository.update(leg.id, { step, approvedBy: approvers.userId, approvedAt: new Date() });
    this.logger.log(`Approved leg ${leg.id} → ${step}`);
    return step;
  }

  // Sends a leg waiting for approval back to sourcing with a reason, leaving the purchase's other legs as they are
  async reject(leg: Leg, approvers: LegApprovers, reason: string): Promise<void> {
    this.assertAwaitingApproval(leg, 'Cannot Reject');
    if (!this.isApprover(approvers)) {
      throw new ForbiddenException({
        label: 'Cannot Reject',
        detail: "Only the approvers on the supplier's enrollment at this site can reject it.",
      });
    }
    await this.repository.update(leg.id, {
      step: PurchaseLegStepValues.SOURCING,
      rejectionReason: reason,
      rejectedAt: new Date(),
      rejectedBy: approvers.userId,
    });
    this.logger.log(`Rejected leg ${leg.id} → SOURCING`);
  }

  // Re-derives a fulfilling leg's step from its documents, closing it once its due quantity is received and invoiced;
  // returns the step it was in and the one it reached
  async advance(leg: Leg, facts: LegFulfilmentFacts): Promise<LegAdvance> {
    const unchanged = { stepBefore: leg.step, stepAfter: leg.step, isClosed: false };
    if (!this.isFulfilling(leg) || !PurchaseSuppliersDomainService.FULFILLED_TYPES.includes(leg.type)) {
      return unchanged;
    }
    const step = this.deriveStep(leg, facts);
    if (step === PurchaseLegStepValues.CLOSED) {
      await this.markClosed(leg, null);
      return { stepBefore: leg.step, stepAfter: step, isClosed: true };
    }
    if (step === leg.step) return unchanged;
    await this.repository.update(leg.id, { step });
    this.logger.log(`Leg ${leg.id} ${leg.step} → ${step}`);
    return { stepBefore: leg.step, stepAfter: step, isClosed: false };
  }

  // Stops a leg expecting more goods, with an optional reason; the caller has completed delivery of its open POs and
  // re-derives its step, so it closes once what it received is invoiced. A type purchases do not fulfil closes outright
  async closeForReceiving(
    leg: Leg & { supplierName: string },
    purchase: LegPurchase,
    facts: LegFulfilmentFacts,
    reason: string | null,
  ): Promise<PurchaseSupplier> {
    this.assertActionAvailable(leg, purchase, facts, PurchaseLegActionValues.CLOSE_SUPPLIER);
    if (!PurchaseSuppliersDomainService.FULFILLED_TYPES.includes(leg.type)) return this.markClosed(leg, reason);
    const closed = await this.repository.update(leg.id, { receivingClosedAt: new Date(), closeReason: reason });
    this.logger.log(`Closed leg ${leg.id} for receiving`);
    return closed;
  }

  // Cancels an open leg nothing is received or invoiced on, with a reason; the caller cancels its documents and returns
  // or drops its allocations in the same transaction
  async cancel(
    leg: Leg & { supplierName: string },
    purchase: LegPurchase,
    facts: LegFulfilmentFacts,
    cancellation: { reason: string; userId: string | null },
  ): Promise<void> {
    const blocker = this.blockersOf(leg, purchase, facts).cancel;
    if (blocker) throw new ConflictException({ label: 'Cannot Cancel Supplier', detail: blocker });
    await this.repository.update(leg.id, {
      status: PurchaseLegStatusValues.CANCELLED,
      cancelledAt: new Date(),
      cancelledBy: cancellation.userId,
      cancelReason: cancellation.reason,
    });
    this.logger.log(`Cancelled leg ${leg.id} from ${leg.step}`);
  }

  // Returns the legs of a purchase with their suppliers' names
  findByPurchaseId(purchaseId: string): Promise<PurchaseSupplierRow[]> {
    return this.repository.findByPurchaseId(purchaseId);
  }

  // Returns one page of a purchase's legs with their suppliers' names and line counts, by step then supplier
  findForTable(purchaseId: string, state: TableState): Promise<{ result: PurchaseSupplierTableRow[]; count: number }> {
    const fieldMap = PurchaseSuppliersDomainService.TABLE_FIELD_MAP;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, fieldMap);
    const { limit = 50, offset = 0 } = state.pagination;
    return this.repository.findForTable(purchaseId, {
      where: and(
        FilterProcessor.buildWhere(state.filters, fieldMap),
        FilterProcessor.buildSearch(state.search, { supplierName: fieldMap.supplierName }),
      ),
      orderBy:
        orderBy.length > 0
          ? orderBy
          : [asc(purchaseSuppliers.status), asc(purchaseSuppliers.step), asc(parties.displayName)],
      limit,
      offset,
    });
  }

  // Counts a purchase's legs and their allocated lines by step and status
  findCounts(purchaseId: string): Promise<PurchaseLegCount[]> {
    return this.repository.findCounts(purchaseId);
  }

  // Returns the legs of a purchase still open in sourcing, the ones its submit starts
  async findInSourcing(purchaseId: string): Promise<PurchaseSupplierRow[]> {
    const legs = await this.repository.findByPurchaseId(purchaseId);
    return legs.filter(
      (leg) => leg.status === PurchaseLegStatusValues.OPEN && leg.step === PurchaseLegStepValues.SOURCING,
    );
  }

  // Returns a supplier's legs at a site that are fulfilling and of the given types, on the given purchases when named
  async findFulfillingForSupplierAtSite(
    supplierId: string,
    types: PurchaseType[],
    purchaseIds?: string[],
    siteId?: string,
  ): Promise<PurchaseSupplierRow[]> {
    const legs = await this.repository.findOpenForSupplierAtSite(supplierId, siteId);
    return legs.filter(
      (leg) =>
        this.isFulfilling(leg) &&
        types.includes(leg.type) &&
        (purchaseIds === undefined || purchaseIds.includes(leg.purchaseId)),
    );
  }

  // Loads the leg of a supplier on a purchase, if one is open
  findForSupplier(purchaseId: string, supplierId: string): Promise<PurchaseSupplier | undefined> {
    return this.repository.findForSupplier(purchaseId, supplierId);
  }

  // Whether a leg may be priced later by its supplier invoice, so its allocations may stay without a unit price
  allowsUnpriced(type: PurchaseType): boolean {
    return PurchaseSuppliersDomainService.UNPRICED_TYPES.includes(type);
  }

  // Whether the user is one of the leg's current approvers and did not submit it
  mayApprove(approvers: LegApprovers): boolean {
    return this.isApprover(approvers) && approvers.userId !== approvers.submitterId;
  }

  // Lists the actions an open leg offers in its step: approval to a user who may approve it, and the fulfilment actions
  // its documents allow once it is fulfilling
  availableActions(
    leg: Leg,
    purchase: LegPurchase,
    approvers: LegApprovers,
    facts: LegFulfilmentFacts,
  ): PurchaseLegAction[] {
    const isOpen = leg.status === PurchaseLegStatusValues.OPEN && purchase.status === PurchaseStatusValues.OPEN;
    if (!isOpen) return [];
    const actions: PurchaseLegAction[] = this.isFulfilling(leg) ? this.fulfilmentActions(leg, facts) : [];
    if (leg.step === PurchaseLegStepValues.SOURCING) {
      actions.push(PurchaseLegActionValues.EDIT_ALLOCATIONS, PurchaseLegActionValues.SUBMIT);
    }
    if (leg.step === PurchaseLegStepValues.APPROVAL) {
      if (this.mayApprove(approvers)) actions.push(PurchaseLegActionValues.APPROVE);
      if (this.isApprover(approvers)) actions.push(PurchaseLegActionValues.REJECT);
    }
    if (this.blockersOf(leg, purchase, facts).cancel === null) actions.push(PurchaseLegActionValues.CANCEL_SUPPLIER);
    return actions;
  }

  // Explains what keeps a leg from being cancelled or closed, or null when it may be: cancel while nothing is received,
  // invoiced or on its way; close once something is received, nothing is on its way and no draft is open
  blockersOf(leg: Leg, purchase: LegPurchase, facts: LegFulfilmentFacts): LegBlockers {
    const state =
      purchase.status !== PurchaseStatusValues.OPEN
        ? `"${purchase.purchaseNumber}" is ${purchase.status.toLowerCase()}.`
        : leg.status !== PurchaseLegStatusValues.OPEN
          ? `This supplier is ${leg.status.toLowerCase()}.`
          : null;
    if (state) return { cancel: state, close: state };
    const draft =
      facts.hasDraftReceipt || facts.hasDraftInvoice
        ? 'A draft goods receipt or supplier invoice is open; post or delete it first.'
        : null;
    const onTheWay = facts.hasDeliveryOnTheWay ? 'A delivery is on its way; receive or cancel it first.' : null;
    const cancel = facts.hasPostedDocument
      ? 'Goods are received or invoiced; close the supplier instead.'
      : (onTheWay ?? draft);
    return { cancel, close: this.closeBlockerOf(leg, facts) ?? onTheWay ?? draft };
  }

  // Whether a leg is open past approval and not closed, so its documents move it
  isFulfilling(leg: Leg): boolean {
    return (
      leg.status === PurchaseLegStatusValues.OPEN &&
      !PurchaseSuppliersDomainService.NOT_FULFILLING_STEPS.includes(leg.step)
    );
  }

  // Where a leg stands in words: "in Goods Receipt" while open, otherwise "closed" / "cancelled"
  describeState(leg: Pick<Leg, 'status' | 'step'>): string {
    if (leg.status === PurchaseLegStatusValues.OPEN) return `in ${PurchaseLegStepLabels[leg.step]}`;
    return leg.status.toLowerCase();
  }

  // Whether a leg's type creates its purchase orders by ordering, before anything arrives
  ordersFirst(type: PurchaseType): boolean {
    return PurchaseSuppliersDomainService.ORDER_TYPES.includes(type);
  }

  // Sums a leg's progress in primary units: due (ordered + free − cancelled, or allocated while not ordered), ordered,
  // received (accepted) and invoiced
  progressOf(facts: LegFulfilmentFacts): LegProgress {
    const quantities = this.quantitiesOf(facts);
    return {
      duePrimaryQty: quantities.due.toNumber(),
      orderedPrimaryQty: quantities.ordered.toNumber(),
      receivedPrimaryQty: quantities.received.toNumber(),
      invoicedPrimaryQty: quantities.invoiced.toNumber(),
    };
  }

  // Derives the earliest stage of a fulfilling leg still open: PURCHASE_ORDER until every PO is confirmed,
  // INBOUND_DELIVERY while confirmed quantity is not on an inbound delivery, GOODS_RECEIPT / RECEIVE_WITH_INVOICE while due
  // quantity is unreceived, SUPPLIER_INVOICE while received quantity is uninvoiced, otherwise CLOSED
  deriveStep(leg: Leg, facts: LegFulfilmentFacts): PurchaseLegStep {
    const quantities = this.quantitiesOf(facts);
    if (this.ordersFirst(leg.type) && !this.isFullyConfirmed(facts)) return PurchaseLegStepValues.PURCHASE_ORDER;
    if (leg.type === PurchaseTypeValues.ANNOUNCED && quantities.remainingToDeliver.gt(0)) {
      return PurchaseLegStepValues.INBOUND_DELIVERY;
    }
    if (quantities.received.lt(quantities.due)) return this.receiveStepOf(leg.type);
    const isInvoiced =
      quantities.invoiced.gte(quantities.due) &&
      quantities.invoiced.gte(quantities.received.minus(quantities.returned));
    if (isInvoiced) return PurchaseLegStepValues.CLOSED;
    return PurchaseSuppliersDomainService.SUPPLIER_INVOICE_TYPES.includes(leg.type)
      ? PurchaseLegStepValues.SUPPLIER_INVOICE
      : this.receiveStepOf(leg.type);
  }

  // Lists the fulfilment actions a leg's type and documents allow; Phase 4 types only close
  fulfilmentActions(leg: Leg, facts: LegFulfilmentFacts): PurchaseLegAction[] {
    const canClose =
      this.closeBlockerOf(leg, facts) === null &&
      !facts.hasDeliveryOnTheWay &&
      !facts.hasDraftReceipt &&
      !facts.hasDraftInvoice;
    if (!PurchaseSuppliersDomainService.FULFILLED_TYPES.includes(leg.type)) {
      return canClose ? [PurchaseLegActionValues.CLOSE_SUPPLIER] : [];
    }
    const quantities = this.quantitiesOf(facts);
    const actions: PurchaseLegAction[] = [];
    if (this.ordersFirst(leg.type)) {
      if (facts.purchaseOrderStatuses.length === 0) actions.push(PurchaseLegActionValues.CREATE_PURCHASE_ORDER);
      if (facts.purchaseOrderStatuses.includes(PurchaseOrderStatusValues.SENT)) {
        actions.push(PurchaseLegActionValues.CONFIRM_PURCHASE_ORDER);
      }
      if (quantities.remainingToDeliver.gt(0)) actions.push(PurchaseLegActionValues.CREATE_INBOUND_DELIVERY);
    }
    if (this.canReceive(leg.type, facts, quantities)) actions.push(PurchaseLegActionValues.CREATE_GOODS_RECEIPT);
    if (this.canReceiveWithInvoice(leg.type, facts, quantities))
      actions.push(PurchaseLegActionValues.RECEIVE_WITH_INVOICE);
    if (PurchaseSuppliersDomainService.SUPPLIER_INVOICE_TYPES.includes(leg.type) && facts.invoiceablePrimaryQty > 0) {
      actions.push(PurchaseLegActionValues.CREATE_SUPPLIER_INVOICE);
    }
    if (canClose) actions.push(PurchaseLegActionValues.CLOSE_SUPPLIER);
    return actions;
  }

  // Rejects a fulfilment action the leg does not offer in its step and with its documents (409)
  assertActionAvailable(
    leg: Leg & { supplierName: string },
    purchase: LegPurchase,
    facts: LegFulfilmentFacts,
    action: PurchaseLegAction,
  ): void {
    const isOpen = leg.status === PurchaseLegStatusValues.OPEN && purchase.status === PurchaseStatusValues.OPEN;
    if (isOpen && this.isFulfilling(leg) && this.fulfilmentActions(leg, facts).includes(action)) return;
    throw new ConflictException({
      label: PurchaseSuppliersDomainService.ACTION_LABELS[action] ?? 'Action Not Available',
      detail: this.unavailableDetail(leg, purchase, facts, action),
    });
  }

  // Whether every leg of a purchase is closed or cancelled and at least one closed, so the purchase can complete
  allDone(legs: Pick<PurchaseSupplier, 'status'>[]): boolean {
    return (
      legs.some((leg) => leg.status === PurchaseLegStatusValues.CLOSED) &&
      legs.every((leg) => leg.status !== PurchaseLegStatusValues.OPEN)
    );
  }

  // Deletes a leg still in sourcing once its last allocation is gone, returning whether it was deleted
  async removeIfUnallocated(leg: Leg, remainingAllocationCount: number): Promise<boolean> {
    if (remainingAllocationCount > 0 || leg.step !== PurchaseLegStepValues.SOURCING) return false;
    await this.repository.delete(leg.id);
    this.logger.log(`Removed leg ${leg.id} with its last allocation`);
    return true;
  }

  // Marks a leg closed in its last step, with the reason it was closed by hand
  private async markClosed(leg: Leg, reason: string | null): Promise<PurchaseSupplier> {
    const closed = await this.repository.update(leg.id, {
      step: PurchaseLegStepValues.CLOSED,
      status: PurchaseLegStatusValues.CLOSED,
      closedAt: new Date(),
      closeReason: reason,
    });
    this.logger.log(`Closed leg ${leg.id} from ${leg.step}`);
    return closed;
  }

  // Works out a leg's quantities in primary units from its allocations and the counters of its PO lines
  private quantitiesOf(facts: LegFulfilmentFacts): LegQuantities {
    const sum = <T>(rows: T[], amount: (row: T) => Decimal.Value) =>
      rows.reduce((total, row) => total.plus(amount(row)), new Decimal(0));
    const lineDue = (line: LegOrderLine) =>
      new Decimal(line.primaryUomQty).plus(line.freePrimaryQty).minus(line.cancelledPrimaryQty);
    const confirmed = facts.orderLines.filter(
      (line) => line.purchaseOrderStatus === PurchaseOrderStatusValues.CONFIRMED,
    );
    const unordered = facts.receivingClosed
      ? new Decimal(0)
      : sum(
          facts.allocations.filter((allocation) => allocation.purchaseOrderItemId === null),
          (allocation) => new Decimal(allocation.primaryUomQty).plus(allocation.freePrimaryQty),
        );
    return {
      due: sum(facts.orderLines, lineDue).plus(unordered),
      ordered: sum(facts.orderLines, (line) => new Decimal(line.primaryUomQty).plus(line.freePrimaryQty)),
      received: sum(facts.orderLines, (line) => line.receivedPrimaryQty),
      returned: sum(facts.orderLines, (line) => line.returnedPrimaryQty),
      invoiced: sum(facts.orderLines, (line) => line.invoicedPrimaryQty),
      unordered,
      remainingToDeliver: sum(confirmed, (line) => Decimal.max(0, line.remainingToDeliverPrimaryQty)),
      openOnConfirmed: sum(confirmed, (line) => Decimal.max(0, lineDue(line).minus(line.receivedPrimaryQty))),
    };
  }

  // Whether the leg has purchase orders and every one of them is confirmed (or already delivery completed)
  private isFullyConfirmed(facts: LegFulfilmentFacts): boolean {
    return (
      facts.purchaseOrderStatuses.length > 0 &&
      facts.purchaseOrderStatuses.every(
        (status) =>
          status === PurchaseOrderStatusValues.CONFIRMED || status === PurchaseOrderStatusValues.DELIVERY_COMPLETED,
      )
    );
  }

  // Returns the step a type receives in: with its supplier invoice for the invoice-with-goods types, else on its own
  private receiveStepOf(type: PurchaseType): PurchaseLegStep {
    return PurchaseSuppliersDomainService.RECEIVE_WITH_INVOICE_TYPES.includes(type)
      ? PurchaseLegStepValues.RECEIVE_WITH_INVOICE
      : PurchaseLegStepValues.GOODS_RECEIPT;
  }

  // Whether a leg can receive on its own: from an ANNOUNCED inbound delivery, or (except ANNOUNCED) its open confirmed lines,
  // or its unordered allocations for a direct receipt
  private canReceive(type: PurchaseType, facts: LegFulfilmentFacts, quantities: LegQuantities): boolean {
    if (type === PurchaseTypeValues.ANNOUNCED) return facts.hasReceivableAnnouncedDelivery;
    if (type === PurchaseTypeValues.STANDARD) {
      return facts.hasReceivableAnnouncedDelivery || quantities.remainingToDeliver.gt(0);
    }
    if (type === PurchaseTypeValues.DIRECT_RECEIPT)
      return quantities.unordered.gt(0) || quantities.remainingToDeliver.gt(0);
    return false;
  }

  // Whether a leg can receive with its supplier invoice: a direct purchase while allocated quantity is unreceived, an
  // order invoiced with the goods while a confirmed PO has open quantity
  private canReceiveWithInvoice(type: PurchaseType, facts: LegFulfilmentFacts, quantities: LegQuantities): boolean {
    if (type === PurchaseTypeValues.DIRECT_PURCHASE) return quantities.received.lt(quantities.due);
    if (type === PurchaseTypeValues.ORDER_INVOICE_WITH_GOODS) {
      return facts.purchaseOrderStatuses.length > 0 && quantities.openOnConfirmed.gt(0);
    }
    return false;
  }

  // Explains why a leg does not offer a fulfilment action
  private unavailableDetail(
    leg: Leg & { supplierName: string },
    purchase: LegPurchase,
    facts: LegFulfilmentFacts,
    action: PurchaseLegAction,
  ): string {
    const legName = `${leg.supplierName} on "${purchase.purchaseNumber}"`;
    if (purchase.status !== PurchaseStatusValues.OPEN)
      return `"${purchase.purchaseNumber}" is ${purchase.status.toLowerCase()}.`;
    if (!this.isFulfilling(leg)) return `${legName} is ${this.describeState(leg)}.`;
    if (
      !PurchaseSuppliersDomainService.FULFILLED_TYPES.includes(leg.type) &&
      action !== PurchaseLegActionValues.CLOSE_SUPPLIER
    ) {
      return `Suppliers set to "${PurchaseTypeLabels[leg.type]}" are not fulfilled through purchases yet; only closing them is possible.`;
    }
    if (action === PurchaseLegActionValues.CLOSE_SUPPLIER) {
      return `${legName}: ${this.blockersOf(leg, purchase, facts).close ?? 'it cannot be closed now.'}`;
    }
    return `${legName} is in ${PurchaseLegStepLabels[leg.step]}, and its documents leave nothing to ${action.toLowerCase().replace(/_/g, ' ')}.`;
  }

  // Explains why an open leg cannot close for receiving by its own state: not ordered yet, nothing received, or already
  // closed for receiving; a type purchases do not fulfil closes whenever no draft is open
  closeBlockerOf(leg: Leg, facts: LegFulfilmentFacts): string | null {
    if (!this.isFulfilling(leg)) return 'Nothing is ordered from this supplier yet; cancel it instead.';
    if (!PurchaseSuppliersDomainService.FULFILLED_TYPES.includes(leg.type)) return null;
    if (facts.receivingClosed) return 'This supplier is already closed for receiving; it closes once it is invoiced.';
    if (!facts.hasPostedDocument) return 'Nothing is received from this supplier yet; cancel it instead.';
    return null;
  }

  // Rejects an action on a leg that is not open in SOURCING (409)
  private assertInSourcing(leg: Leg, label: string): void {
    if (leg.status === PurchaseLegStatusValues.OPEN && leg.step === PurchaseLegStepValues.SOURCING) return;
    throw new ConflictException({
      label,
      detail: `This supplier is ${this.describeState(leg)}, not open in Sourcing.`,
    });
  }

  // Rejects an action on a leg that is not open in APPROVAL (409)
  private assertAwaitingApproval(leg: Leg, label: string): void {
    if (leg.status === PurchaseLegStatusValues.OPEN && leg.step === PurchaseLegStepValues.APPROVAL) return;
    throw new ConflictException({
      label,
      detail: `This supplier is ${this.describeState(leg)}, not waiting for approval.`,
    });
  }

  // Whether the user is one of the leg's current approvers
  private isApprover(approvers: LegApprovers): boolean {
    return approvers.userId !== null && approvers.approverUserIds.includes(approvers.userId);
  }

  // Approval applies when it is enabled and the leg has no threshold, is sourced in another currency than the legal
  // entity's, has an unknown total, or its total reaches the threshold
  private requiresApproval(enrollment: LegEnrollmentSnapshot, sourcing: LegSourcing, leCurrencyCode: string): boolean {
    if (!enrollment.approvalEnabled) return false;
    if (enrollment.approvalThreshold === null) return true;
    if (sourcing.currencyCodes.some((currencyCode) => currencyCode !== leCurrencyCode)) return true;
    if (sourcing.total === null) return true;
    return sourcing.total >= enrollment.approvalThreshold;
  }
}
