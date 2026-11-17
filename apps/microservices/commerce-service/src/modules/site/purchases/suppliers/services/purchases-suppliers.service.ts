import { PurchaseAllocationDto } from '@domain/purchase-item-allocations/dto/entity/purchase-allocation.dto';
import type { PurchaseAllocationRow } from '@domain/purchase-item-allocations/repositories/purchase-item-allocations.repository';
import { PurchaseItemAllocationsDomainService } from '@domain/purchase-item-allocations/services/purchase-item-allocations.service';
import { PurchaseSupplierDto } from '@domain/purchase-suppliers/dto/entity/purchase-supplier.dto';
import type {
  PurchaseLegCount,
  PurchaseSupplierRow,
} from '@domain/purchase-suppliers/repositories/purchase-suppliers.repository';
import { PurchaseSuppliersDomainRepository } from '@domain/purchase-suppliers/repositories/purchase-suppliers.repository';
import { PurchaseSuppliersDomainService } from '@domain/purchase-suppliers/services/purchase-suppliers.service';
import type { PurchaseRow } from '@domain/purchases/repositories/purchases.repository';
import { PurchasesDomainRepository } from '@domain/purchases/repositories/purchases.repository';
import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import { Injectable } from '@nestjs/common';
import type { TableState } from '@vritti/api-sdk/data-table';
import _ from '@vritti/api-sdk/lodash';
import type { NatsHeaders } from '@vritti/api-sdk/nats';
import { pluralize } from '@vritti/api-sdk/pluralize';
import { PurchaseLegStepValues, PurchaseOrderStatusValues } from '@/db/schema';
import {
  type PurchaseLegFulfilment,
  PurchaseProgressService,
} from '@/modules/site/purchase-progress/services/purchase-progress.service';
import {
  PurchaseLegDocumentsDto,
  PurchaseLegDto,
  type PurchaseLegRejection,
  type PurchaseSupplierDocumentsDto,
} from '../dto/entity/purchase-leg.dto';

interface PurchaseLegSources {
  allocations: PurchaseAllocationRow[];
  approversByEnrollment: Map<string, string[]>;
}

@Injectable()
export class PurchasesSuppliersService {
  constructor(
    private readonly purchasesRepository: PurchasesDomainRepository,
    private readonly legsService: PurchaseSuppliersDomainService,
    private readonly purchaseSuppliersRepository: PurchaseSuppliersDomainRepository,
    private readonly allocationsService: PurchaseItemAllocationsDomainService,
    private readonly supplierEnrollmentsService: SupplierEnrollmentsDomainService,
    private readonly progressService: PurchaseProgressService,
  ) {}

  // Returns one page of a purchase's legs, each with its documents, progress, line count, the actions it offers the
  // caller and why it cannot be cancelled or closed; its allocations come with the leg on its own
  async findForTable(
    id: string,
    state: TableState,
    headers: NatsHeaders,
    leCurrencyCode: string,
  ): Promise<{ result: PurchaseLegDto[]; count: number }> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    const { result: legs, count } = await this.legsService.findForTable(purchase.id, state);
    const allocations = await this.allocationsService.findByLegIds(legs.map((leg) => leg.id));
    const approversByEnrollment = await this.supplierEnrollmentsService.findApproverUserIds(
      legs.map((leg) => leg.supplierEnrollmentId),
    );
    const fulfilment = await this.progressService.findFulfilment(purchase, legs);
    const result = legs.map((leg, index) => {
      const described = this.describeLeg(
        purchase,
        leg,
        { sources: { allocations, approversByEnrollment }, fulfilment: fulfilment[index] },
        headers,
        leCurrencyCode,
      );
      return Object.assign(described, { allocations: [] });
    });
    return { result, count };
  }

  // Returns one leg of a purchase with its allocations, approvers, last start and rejection, documents, progress, the
  // actions it offers the caller and why it cannot be cancelled or closed
  async findById(id: string, legId: string, headers: NatsHeaders, leCurrencyCode: string): Promise<PurchaseLegDto> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    const leg = await this.purchaseSuppliersRepository.findOnPurchaseOrThrow(purchase.id, legId);
    const allocations = await this.allocationsService.findByLegIds([leg.id]);
    const approversByEnrollment = await this.supplierEnrollmentsService.findApproverUserIds([leg.supplierEnrollmentId]);
    const fulfilment = await this.progressService.findLegFulfilment(purchase, leg);
    return this.describeLeg(
      purchase,
      leg,
      { sources: { allocations, approversByEnrollment }, fulfilment },
      headers,
      leCurrencyCode,
    );
  }

  // Counts a purchase's legs and their allocated lines by step and status
  async findCounts(id: string): Promise<PurchaseLegCount[]> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    return this.legsService.findCounts(purchase.id);
  }

  // Returns the documents of every leg of a purchase, with the leg's supplier
  async findDocuments(id: string): Promise<PurchaseSupplierDocumentsDto[]> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    const legs = await this.legsService.findByPurchaseId(purchase.id);
    const documents = await this.progressService.findLegDocuments(purchase.id, legs);
    return legs.map((leg, index) => ({
      legId: leg.id,
      supplierId: leg.supplierId,
      supplierName: leg.supplierName,
      documents: PurchaseLegDocumentsDto.from(documents[index]),
    }));
  }

  // Shapes a leg with its allocations, current approvers, last start and rejection, documents, progress, the actions it
  // offers the caller and why it cannot be cancelled or closed
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
      ...this.allocationsService.sourcedTotal(allocations, leCurrencyCode),
      rejection: this.rejectionOf(leg),
      lineCount: allocations.length,
      allocations: allocations.map((allocation) =>
        PurchaseAllocationDto.from(allocation, this.openForInboundDeliveryPrimaryQty(allocation, fulfilment)),
      ),
      documents: PurchaseLegDocumentsDto.from(fulfilment.documents),
      progress: this.legsService.progressOf(fulfilment.facts),
      availableActions: this.legsService.availableActions(leg, purchase, approvers, fulfilment.facts),
      blockers: {
        ...this.legsService.blockersOf(leg, purchase, fulfilment.facts),
        order: this.orderBlockerOf(allocations),
      },
    });
  }

  // Why a leg's orders cannot be placed: the site has blocked buying some of the items allocated to it
  private orderBlockerOf(allocations: PurchaseAllocationRow[]): string | null {
    const blockedCount = _.uniqBy(
      allocations.filter((allocation) => allocation.purchasingBlockedReason !== null),
      'inventoryItemId',
    ).length;
    if (blockedCount === 0) return null;
    return `Purchasing is blocked at this site for ${pluralize('item', blockedCount, true)} allocated to this supplier; remove those allocations first.`;
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
