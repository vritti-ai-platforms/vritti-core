import { PurchaseItemAllocationsDomainService } from '@domain/purchase-item-allocations/services/purchase-item-allocations.service';
import { PurchaseItemsDomainService } from '@domain/purchase-items/services/purchase-items.service';
import { PurchaseSuppliersDomainService } from '@domain/purchase-suppliers/services/purchase-suppliers.service';
import type { PurchaseDto } from '@domain/purchases/dto/entity/purchase.dto';
import { PurchaseActionsDto } from '@domain/purchases/dto/entity/purchase-actions.dto';
import { PurchaseCountsDto } from '@domain/purchases/dto/entity/purchase-counts.dto';
import { PurchaseProgressDto } from '@domain/purchases/dto/entity/purchase-progress.dto';
import type { CancelPurchaseDto } from '@domain/purchases/dto/request/cancel-purchase.dto';
import type { ChangePurchaseMinQuotationsDto } from '@domain/purchases/dto/request/change-purchase-min-quotations.dto';
import type { ChangePurchaseNotesDto } from '@domain/purchases/dto/request/change-purchase-notes.dto';
import type { ClosePurchaseDto } from '@domain/purchases/dto/request/close-purchase.dto';
import type { CreatePurchaseDto } from '@domain/purchases/dto/request/create-purchase.dto';
import type { DisablePurchaseQuotationsDto } from '@domain/purchases/dto/request/disable-purchase-quotations.dto';
import type { EnablePurchaseQuotationsDto } from '@domain/purchases/dto/request/enable-purchase-quotations.dto';
import { PurchasesDomainRepository } from '@domain/purchases/repositories/purchases.repository';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import type { NatsHeaders } from '@vritti/api-sdk/nats';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type PurchaseLegStep, PurchaseLegStepValues } from '@/db/schema';
import { PurchaseProgressService } from '@/modules/site/purchase-progress/services/purchase-progress.service';
import { PurchasesLegsService } from '../../legs/services/purchases-legs.service';
import { PurchasesQuotationsService } from '../../quotations/services/purchases-quotations.service';

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly purchasesService: PurchasesDomainService,
    private readonly purchasesRepository: PurchasesDomainRepository,
    readonly _legsService: PurchaseSuppliersDomainService,
    private readonly itemsService: PurchaseItemsDomainService,
    private readonly allocationsService: PurchaseItemAllocationsDomainService,
    private readonly progressService: PurchaseProgressService,
    private readonly purchaseLegsService: PurchasesLegsService,
    private readonly purchaseQuotationsService: PurchasesQuotationsService,
  ) {}

  // Opens a purchase at a site; its items can be quoted and allocated as soon as they are added
  async create(dto: CreatePurchaseDto, siteId?: string): Promise<CreateResponseDto<PurchaseDto>> {
    const purchase = await this.purchasesService.create(dto, siteId);
    this.logger.log(`purchases.create — ${purchase.purchaseNumber} at site ${purchase.siteId}`);
    return {
      success: true,
      message: `Purchase "${purchase.purchaseNumber}" created.`,
      data: await this.purchasesService.findById(purchase.id),
    };
  }

  // Changes an open purchase's notes
  async changeNotes(dto: ChangePurchaseNotesDto): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(dto.id);
    return this.purchasesService.changeNotes(purchase, dto.notes);
  }

  // Requires quotations on a purchase none of whose suppliers is submitted yet
  async enableQuotations(dto: EnablePurchaseQuotationsDto, headers: NatsHeaders): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(dto.id);
    const { blockers } = await this.purchaseLegsService.findBlockers(purchase);
    return this.purchasesService.enableQuotations(purchase, dto.minQuotations, blockers, headers.userId || null);
  }

  // Stops requiring quotations on an open purchase, with why
  async disableQuotations(dto: DisablePurchaseQuotationsDto, headers: NatsHeaders): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(dto.id);
    return this.purchasesService.disableQuotations(purchase, dto.reason, headers.userId || null);
  }

  // Changes how many posted quotations each item needs before its supplier is submitted
  async changeMinQuotations(dto: ChangePurchaseMinQuotationsDto, headers: NatsHeaders): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(dto.id);
    return this.purchasesService.changeMinQuotations(purchase, dto, headers.userId || null);
  }

  // Starts every supplier still in sourcing, each to approval or its type's first fulfilment step
  async submit(id: string, headers: NatsHeaders, leCurrencyCode: string): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    const { blockers, open } = await this.purchaseLegsService.findBlockers(purchase);
    const legs = open.filter((leg) => leg.step === PurchaseLegStepValues.SOURCING);
    const steps = await this.database.runInTransaction(async () => {
      await this.purchasesService.submit(purchase, blockers);
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
      message: `${pluralize('supplier', legs.length, true)} on "${purchase.purchaseNumber}" submitted, ${awaitingApprovalCount} waiting for approval.`,
    };
  }

  // Closes a purchase: suppliers with goods received close for receiving, the others are cancelled with their quantity
  // dropped, and every item is lowered to what is allocated of it; it completes once its suppliers are done
  async close(dto: ClosePurchaseDto, headers: NatsHeaders): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(dto.id);
    const { blockers, open: legs, fulfilment } = await this.purchaseLegsService.findBlockers(purchase);
    this.purchasesRepository.assertClosable(blockers);
    const reason = dto.reason ?? null;
    await this.database.runInTransaction(async () => {
      for (const [index, leg] of legs.entries()) {
        const { facts } = fulfilment[index];
        if (facts.receivingClosed) continue;
        if (facts.hasPostedDocument) {
          await this.purchaseLegsService.closeForReceiving(purchase, leg, fulfilment[index], reason);
          continue;
        }
        await this.purchaseLegsService.cancelLeg(purchase, leg, fulfilment[index], {
          reason: reason ?? 'Purchase closed',
          userId: headers.userId || null,
        });
        await this.itemsService.lowerBy(purchase.id, await this.allocationsService.removeForLeg(leg.id));
      }
      await this.itemsService.lowerToAllocated(purchase.id);
      await this.progressService.completeIfDone(purchase);
    });
    this.logger.log(`purchases.close — ${purchase.purchaseNumber}, legs: ${legs.length}`);
    return { success: true, message: `Purchase "${purchase.purchaseNumber}" closed; nothing more is expected.` };
  }

  // Cancels an open purchase with a reason, with every open supplier and the documents it ordered
  async cancel(dto: CancelPurchaseDto, headers: NatsHeaders): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(dto.id);
    const { blockers, open: legs, fulfilment } = await this.purchaseLegsService.findBlockers(purchase);
    await this.database.runInTransaction(async () => {
      await this.purchasesService.cancel(purchase, dto.reason, blockers);
      for (const [index, leg] of legs.entries()) {
        await this.purchaseLegsService.cancelLeg(purchase, leg, fulfilment[index], {
          reason: dto.reason,
          userId: headers.userId || null,
        });
      }
    });
    this.logger.log(`purchases.cancel — ${purchase.purchaseNumber}, legs cancelled: ${legs.length}`);
    return { success: true, message: `Purchase "${purchase.purchaseNumber}" cancelled.` };
  }

  // Returns one purchase
  findById(id: string): Promise<PurchaseDto> {
    return this.purchasesService.findById(id);
  }

  // Counts a purchase's item lines, suppliers and requested quotations
  async findCounts(id: string): Promise<PurchaseCountsDto> {
    const [counts, quotationCount] = await Promise.all([
      this.purchasesRepository.findCountsOrThrow(id),
      this.purchaseQuotationsService.countForPurchase(id),
    ]);
    return PurchaseCountsDto.from(counts, quotationCount);
  }

  // Returns how far a purchase's items have got and where it stands as a whole
  async findProgress(id: string): Promise<PurchaseProgressDto> {
    return PurchaseProgressDto.from(await this.purchasesRepository.findProgressOrThrow(id));
  }

  // Returns the actions a purchase offers and why the others are blocked
  async findActions(id: string): Promise<PurchaseActionsDto> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    const { blockers } = await this.purchaseLegsService.findBlockers(purchase);
    return PurchaseActionsDto.from(this.purchasesService.availableActions(purchase, blockers), blockers);
  }

  // Deletes an open purchase no supplier is added to
  async delete(id: string): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    const { blockers } = await this.purchaseLegsService.findBlockers(purchase);
    await this.purchasesService.delete(purchase, blockers);
    this.logger.log(`purchases.delete — ${purchase.purchaseNumber}`);
    return { success: true, message: `Purchase "${purchase.purchaseNumber}" deleted.` };
  }
}
