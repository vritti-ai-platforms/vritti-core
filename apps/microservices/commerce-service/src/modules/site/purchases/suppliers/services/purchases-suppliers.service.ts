import { PurchaseAllocationDto } from '@domain/purchase-item-allocations/dto/entity/purchase-allocation.dto';
import type { PurchaseAllocationRow } from '@domain/purchase-item-allocations/repositories/purchase-item-allocations.repository';
import { PurchaseItemAllocationsDomainService } from '@domain/purchase-item-allocations/services/purchase-item-allocations.service';
import { PurchaseSupplierDto } from '@domain/purchase-suppliers/dto/entity/purchase-supplier.dto';
import type { PurchaseSupplierRow } from '@domain/purchase-suppliers/repositories/purchase-suppliers.repository';
import { PurchaseSuppliersDomainService } from '@domain/purchase-suppliers/services/purchase-suppliers.service';
import type { PurchaseRow } from '@domain/purchases/repositories/purchases.repository';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import { Injectable } from '@nestjs/common';
import type { NatsHeaders } from '@vritti/api-sdk/nats';
import { PurchaseLegStepValues, PurchaseOrderStatusValues } from '@/db/schema';
import {
  type PurchaseLegFulfilment,
  PurchaseProgressService,
} from '@/modules/site/purchase-progress/services/purchase-progress.service';
import { PurchaseLegDocumentsDto, PurchaseLegDto, type PurchaseLegRejection } from '../dto/entity/purchase-leg.dto';

interface PurchaseLegSources {
  allocations: PurchaseAllocationRow[];
  approversByEnrollment: Map<string, string[]>;
}

@Injectable()
export class PurchasesSuppliersService {
  constructor(
    private readonly purchasesService: PurchasesDomainService,
    private readonly legsService: PurchaseSuppliersDomainService,
    private readonly allocationsService: PurchaseItemAllocationsDomainService,
    private readonly supplierEnrollmentsService: SupplierEnrollmentsDomainService,
    private readonly progressService: PurchaseProgressService,
  ) {}

  // Returns the legs of a purchase in reach, each with its allocations, approvers, last start and rejection, documents,
  // progress and the actions it offers the caller
  async findByPurchase(id: string, headers: NatsHeaders, leCurrencyCode: string): Promise<PurchaseLegDto[]> {
    const purchase = await this.purchasesService.findDetailOrThrow(id);
    const [legs, allocations] = await Promise.all([
      this.legsService.findByPurchaseId(purchase.id),
      this.allocationsService.findByPurchaseId(purchase.id),
    ]);
    const approversByEnrollment = await this.supplierEnrollmentsService.findApproverUserIds(
      legs.map((leg) => leg.supplierEnrollmentId),
    );
    const sources: PurchaseLegSources = { allocations, approversByEnrollment };
    const fulfilment = await this.progressService.findFulfilment(purchase, legs);
    return legs.map((leg, index) =>
      this.describeLeg(purchase, leg, { sources, fulfilment: fulfilment[index] }, headers, leCurrencyCode),
    );
  }

  // Shapes a leg with its allocations, current approvers, last start and rejection, documents, progress and the actions
  // it offers the caller
  private describeLeg(
    purchase: PurchaseRow,
    leg: PurchaseSupplierRow,
    { sources, fulfilment }: { sources: PurchaseLegSources; fulfilment: PurchaseLegFulfilment },
    headers: NatsHeaders,
    leCurrencyCode: string,
  ): PurchaseLegDto {
    const allocations = sources.allocations.filter((allocation) => allocation.purchaseSupplierId === leg.id);
    const approverUserIds = sources.approversByEnrollment.get(leg.supplierEnrollmentId) ?? [];
    const approvers = { userId: headers.userId || null, approverUserIds, submitterId: leg.submittedBy };
    return PurchaseLegDto.fromLeg(PurchaseSupplierDto.from(leg, leCurrencyCode), {
      submittedAt: leg.submittedAt?.toISOString() ?? null,
      approverUserIds,
      ...this.allocationsService.sourcedTotal(allocations),
      rejection: this.rejectionOf(leg),
      allocations: allocations.map((allocation) =>
        PurchaseAllocationDto.from(allocation, this.openForInboundDeliveryPrimaryQty(allocation, fulfilment)),
      ),
      documents: PurchaseLegDocumentsDto.from(fulfilment.documents),
      progress: this.legsService.progressOf(fulfilment.facts),
      availableActions: this.legsService.availableActions(leg, purchase, approvers, fulfilment.facts),
    });
  }

  // Returns a leg's last rejection while it is back in sourcing
  private rejectionOf(leg: PurchaseSupplierRow): PurchaseLegRejection | null {
    if (leg.step !== PurchaseLegStepValues.SOURCING || !leg.rejectionReason || !leg.rejectedAt) return null;
    return { reason: leg.rejectionReason, actorId: leg.rejectedBy, at: leg.rejectedAt.toISOString() };
  }

  // Returns what an allocation's PO line, on a confirmed PO, has not yet put on a delivery, in primary units
  private openForInboundDeliveryPrimaryQty(
    allocation: PurchaseAllocationRow,
    fulfilment: PurchaseLegFulfilment,
  ): number {
    const isConfirmed = fulfilment.documents.purchaseOrders.some(
      (po) => po.id === allocation.purchaseOrderId && po.status === PurchaseOrderStatusValues.CONFIRMED,
    );
    if (!isConfirmed || allocation.purchaseOrderItemId === null) return 0;
    return Math.max(0, fulfilment.remainingByLine.get(allocation.purchaseOrderItemId) ?? 0);
  }
}
