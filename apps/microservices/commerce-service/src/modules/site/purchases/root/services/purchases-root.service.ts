import { InventoryItemSiteStockLevelsDomainService } from '@domain/inventory-item-site-stock-levels/services/inventory-item-site-stock-levels.service';
import { PurchaseEventActionValues } from '@domain/purchase-events/dto/entity/purchase-event.dto';
import { PurchaseEventsDomainService } from '@domain/purchase-events/services/purchase-events.service';
import { PurchaseItemAllocationsDomainService } from '@domain/purchase-item-allocations/services/purchase-item-allocations.service';
import { PurchaseItemsDomainService } from '@domain/purchase-items/services/purchase-items.service';
import { PurchaseSuppliersDomainService } from '@domain/purchase-suppliers/services/purchase-suppliers.service';
import { type PurchaseDto, PurchaseStepLabels } from '@domain/purchases/dto/entity/purchase.dto';
import { PurchaseHeaderDto } from '@domain/purchases/dto/entity/purchase-header.dto';
import type { CancelPurchaseDto } from '@domain/purchases/dto/request/cancel-purchase.dto';
import type { CreatePurchaseDto } from '@domain/purchases/dto/request/create-purchase.dto';
import type { UpdatePurchaseDto } from '@domain/purchases/dto/request/update-purchase.dto';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { SupplierQuotationsDomainService } from '@domain/supplier-quotations/services/supplier-quotations.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import _ from '@vritti/api-sdk/lodash';
import type { NatsHeaders } from '@vritti/api-sdk/nats';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type PurchaseLegStep, PurchaseLegStepValues } from '@/db/schema';
import { PurchasesLegsService } from '../../legs/services/purchases-legs.service';
import { PurchasesQuotationsService } from '../../quotations/services/purchases-quotations.service';

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly purchasesService: PurchasesDomainService,
    private readonly itemsService: PurchaseItemsDomainService,
    private readonly legsService: PurchaseSuppliersDomainService,
    private readonly allocationsService: PurchaseItemAllocationsDomainService,
    private readonly eventsService: PurchaseEventsDomainService,
    private readonly siteStockLevelsService: InventoryItemSiteStockLevelsDomainService,
    private readonly supplierQuotationsService: SupplierQuotationsDomainService,
    private readonly purchaseLegsService: PurchasesLegsService,
    private readonly purchaseQuotationsService: PurchasesQuotationsService,
  ) {}

  // Opens a purchase at a site with its first items, each enabled at the site; an item listed twice gets one
  // line with both quantities
  async create(dto: CreatePurchaseDto, siteId: string, headers: NatsHeaders): Promise<CreateResponseDto<PurchaseDto>> {
    const items = dto.items ?? [];
    await this.siteStockLevelsService.ensureStockLevels(
      siteId,
      _.uniq(items.map((item) => item.inventoryItemId)),
      'items',
    );
    const purchase = await this.database.runInTransaction(async () => {
      const created = await this.purchasesService.create(dto, { siteId, createdBy: headers.userId || null });
      for (const item of items) await this.itemsService.add(created, item, headers.userId || null);
      await this.eventsService.record({
        purchaseId: created.id,
        action: PurchaseEventActionValues.CREATE,
        stepAfter: created.step,
        actorId: headers.userId || null,
      });
      return created;
    });
    this.logger.log(`purchases.create — ${purchase.purchaseNumber} at site ${siteId}, items: ${items.length}`);
    return {
      success: true,
      message: `Purchase "${purchase.purchaseNumber}" created.`,
      data: await this.purchasesService.findById(purchase.id),
    };
  }

  // Changes a purchase's header while it is in REQUESTING
  async update(dto: UpdatePurchaseDto, headers: NatsHeaders): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(dto.id);
    return this.database.runInTransaction(async () => {
      const result = await this.purchasesService.update(purchase, dto);
      await this.eventsService.record({
        purchaseId: purchase.id,
        action: PurchaseEventActionValues.UPDATE,
        actorId: headers.userId || null,
      });
      return result;
    });
  }

  // Cancels an open purchase with a reason, cancelling its open legs
  async cancel(dto: CancelPurchaseDto, headers: NatsHeaders): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(dto.id);
    const cancelledLegCount = await this.database.runInTransaction(async () => {
      await this.purchasesService.cancel(purchase);
      const count = await this.legsService.cancelOpen(purchase.id);
      await this.eventsService.record({
        purchaseId: purchase.id,
        action: PurchaseEventActionValues.CANCEL,
        stepBefore: purchase.step,
        reason: dto.reason,
        actorId: headers.userId || null,
      });
      return count;
    });
    this.logger.log(`purchases.cancel — ${purchase.purchaseNumber}, legs cancelled: ${cancelledLegCount}`);
    return { success: true, message: `Purchase "${purchase.purchaseNumber}" cancelled.` };
  }

  // Submits a purchase's items, moving it to quoting or sourcing
  async submitItems(id: string, headers: NatsHeaders): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(id);
    const step = await this.database.runInTransaction(async () => {
      const nextStep = await this.purchasesService.submitItems(purchase);
      await this.eventsService.record({
        purchaseId: purchase.id,
        action: PurchaseEventActionValues.SUBMIT_ITEMS,
        stepBefore: purchase.step,
        stepAfter: nextStep,
        actorId: headers.userId || null,
      });
      return nextStep;
    });
    return {
      success: true,
      message: `Items of "${purchase.purchaseNumber}" submitted; it is now in ${PurchaseStepLabels[step]}.`,
    };
  }

  // Submits a purchase in sourcing: it moves to procuring and every leg still in sourcing starts, each to approval or
  // its type's first fulfilment step
  async submit(id: string, headers: NatsHeaders, leCurrencyCode: string): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(id);
    const legs = await this.legsService.findInSourcing(purchase.id);
    const steps = await this.database.runInTransaction(async () => {
      await this.purchasesService.submit(purchase, legs.length);
      const reached: PurchaseLegStep[] = [];
      for (const leg of legs) {
        reached.push(
          await this.purchaseLegsService.startLeg(
            purchase,
            leg,
            PurchaseEventActionValues.SUBMIT,
            headers,
            leCurrencyCode,
          ),
        );
      }
      return reached;
    });
    const awaitingApprovalCount = steps.filter((step) => step === PurchaseLegStepValues.APPROVAL).length;
    this.logger.log(`purchases.submit — ${purchase.purchaseNumber}, legs: ${legs.length}`);
    return {
      success: true,
      message: `Purchase "${purchase.purchaseNumber}" submitted; ${pluralize('supplier', legs.length, true)} started, ${awaitingApprovalCount} waiting for approval.`,
    };
  }

  // Returns a purchase's header with its item, quotation and supplier counts, its progress and the actions it offers
  // the caller, from counts rather than its legs
  async findHeader(id: string, headers: NatsHeaders): Promise<PurchaseHeaderDto> {
    const purchase = await this.purchasesService.findHeaderOrThrow(id);
    const quotations = await this.purchaseQuotationsService.countForPurchase(purchase, headers);
    return PurchaseHeaderDto.fromHeader(purchase, {
      quotationCount: quotations.quotationCount,
      availableActions: this.purchasesService.availableActions(purchase, {
        postedSupplierCount: quotations.postedSupplierCount,
        hasSourcingLeg: purchase.hasSourcingLeg,
        hasQuotations: quotations.quotationCount > 0,
        hasAllocations: purchase.hasAllocations,
        hasLegs: purchase.supplierCount > 0,
      }),
    });
  }

  // Deletes a purchase nothing exists behind yet, re-checking its quotations, allocations and legs in the legal entity's
  // workspace so draft quotations count too
  async delete(id: string, headers: NatsHeaders): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(id);
    await this.purchaseQuotationsService.inLegalEntityWorkspace(headers, () =>
      this.database.runInTransaction(async () => {
        const current = await this.purchasesService.findDetailOrThrow(purchase.id);
        const hasQuotations = await this.supplierQuotationsService.hasForPurchase(purchase.id);
        const allocations = await this.allocationsService.findByPurchaseId(purchase.id);
        const legs = await this.legsService.findByPurchaseId(purchase.id);
        await this.purchasesService.delete(current, {
          hasQuotations,
          hasAllocations: allocations.length > 0,
          hasLegs: legs.length > 0,
        });
      }),
    );
    this.logger.log(`purchases.delete — ${purchase.purchaseNumber}`);
    return { success: true, message: `Purchase "${purchase.purchaseNumber}" deleted.` };
  }
}
