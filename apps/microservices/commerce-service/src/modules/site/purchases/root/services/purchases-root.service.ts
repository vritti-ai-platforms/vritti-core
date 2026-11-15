import { PurchaseSuppliersDomainService } from '@domain/purchase-suppliers/services/purchase-suppliers.service';
import { type PurchaseDto, PurchaseStepLabels } from '@domain/purchases/dto/entity/purchase.dto';
import { PurchaseHeaderDto } from '@domain/purchases/dto/entity/purchase-header.dto';
import type { CancelPurchaseDto } from '@domain/purchases/dto/request/cancel-purchase.dto';
import type { CreatePurchaseDto } from '@domain/purchases/dto/request/create-purchase.dto';
import type { UpdatePurchaseDto } from '@domain/purchases/dto/request/update-purchase.dto';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
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
    private readonly legsService: PurchaseSuppliersDomainService,
    private readonly purchaseLegsService: PurchasesLegsService,
    private readonly purchaseQuotationsService: PurchasesQuotationsService,
  ) {}

  // Opens a purchase at a site; its items are added in the Requesting stage
  async create(dto: CreatePurchaseDto, siteId?: string): Promise<CreateResponseDto<PurchaseDto>> {
    const purchase = await this.purchasesService.create(dto, siteId);
    this.logger.log(`purchases.create — ${purchase.purchaseNumber} at site ${purchase.siteId}`);
    return {
      success: true,
      message: `Purchase "${purchase.purchaseNumber}" created.`,
      data: await this.purchasesService.findById(purchase.id),
    };
  }

  // Changes a purchase's header while it is in REQUESTING
  async update(dto: UpdatePurchaseDto): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(dto.id);
    return this.purchasesService.update(purchase, dto);
  }

  // Cancels an open purchase with a reason, cancelling its open legs
  async cancel(dto: CancelPurchaseDto): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(dto.id);
    const cancelledLegCount = await this.database.runInTransaction(async () => {
      await this.purchasesService.cancel(purchase, dto.reason);
      return this.legsService.cancelOpen(purchase.id);
    });
    this.logger.log(`purchases.cancel — ${purchase.purchaseNumber}, legs cancelled: ${cancelledLegCount}`);
    return { success: true, message: `Purchase "${purchase.purchaseNumber}" cancelled.` };
  }

  // Submits a purchase's items, moving it to quoting or sourcing
  async submitItems(id: string): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(id);
    const step = await this.purchasesService.submitItems(purchase);
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
        reached.push(await this.purchaseLegsService.startLeg(purchase, leg, headers, leCurrencyCode));
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
  async findHeader(id: string): Promise<PurchaseHeaderDto> {
    const purchase = await this.purchasesService.findHeaderOrThrow(id);
    const quotations = await this.purchaseQuotationsService.countForPurchase(purchase);
    return PurchaseHeaderDto.fromHeader(purchase, {
      quotationCount: quotations.quotationCount,
      availableActions: this.purchasesService.availableActions(purchase, {
        postedSupplierCount: quotations.postedSupplierCount,
        hasSourcingLeg: purchase.hasSourcingLeg,
      }),
    });
  }

  // Deletes a purchase whose items are not submitted yet
  async delete(id: string): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(id);
    await this.purchasesService.delete(purchase);
    this.logger.log(`purchases.delete — ${purchase.purchaseNumber}`);
    return { success: true, message: `Purchase "${purchase.purchaseNumber}" deleted.` };
  }
}
