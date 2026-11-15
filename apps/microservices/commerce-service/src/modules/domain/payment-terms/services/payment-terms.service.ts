import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import Decimal from '@vritti/api-sdk/decimal';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult, selectPageOptions } from '@vritti/api-sdk/select';
import { type PaymentTerm, type PaymentTermBaseline, paymentTerms } from '@/db/schema';
import { PaymentTermDetailDto, PaymentTermDto } from '../dto/entity/payment-term.dto';
import type { CreatePaymentTermDto } from '../dto/request/create-payment-term.dto';
import type { UpdatePaymentTermDto } from '../dto/request/update-payment-term.dto';
import { type PaymentTermDetail, PaymentTermsDomainRepository } from '../repositories/payment-terms.repository';

@Injectable()
export class PaymentTermsDomainService {
  private readonly logger = new Logger(PaymentTermsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: paymentTerms.name, type: 'string' },
    baseline: { column: paymentTerms.baseline, type: 'string' },
    isPublished: { column: paymentTerms.isPublished, type: 'boolean' },
  };

  // Search runs ILIKE, which Postgres enums (baseline) don't support — so it only covers the text columns
  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    name: PaymentTermsDomainService.FIELD_MAP.name,
  };

  constructor(private readonly repository: PaymentTermsDomainRepository) {}

  // Returns paginated payment terms for the data table
  async findForTable(state: TableState): Promise<{ result: PaymentTermDto[]; count: number }> {
    const fieldMap = PaymentTermsDomainService.FIELD_MAP;
    const { limit = 20, offset = 0 } = state.pagination;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, fieldMap);
    const { result, count } = await this.repository.findAllAndCount({
      where: and(
        FilterProcessor.buildWhere(state.filters, fieldMap),
        FilterProcessor.buildSearch(state.search, PaymentTermsDomainService.SEARCH_FIELD_MAP),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [desc(paymentTerms.createdAt)],
      limit,
      offset,
    });
    return { result: result.map((row) => PaymentTermDto.from(row)), count };
  }

  // Returns published payment-term options so drafts cannot be picked; `allowUnpublished` lists drafts too, for
  // navigation (the breadcrumb switcher)
  findForSelect(query: SelectOptionsQueryDto, options?: { allowUnpublished?: boolean }): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      ...selectPageOptions(query),
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
      where: options?.allowUnpublished ? undefined : { isPublished: true },
    });
  }

  // Loads a payment term, throwing when it is out of reach
  async findByIdOrThrow(id: string): Promise<PaymentTerm> {
    const term = await this.repository.findById(id);
    if (!term) throw new NotFoundException('Payment term not found.');
    return term;
  }

  // Returns a payment term with its rule count, rule total and how many suppliers use it
  async findById(id: string): Promise<PaymentTermDetailDto> {
    return PaymentTermDetailDto.from(await this.findDetailOrThrow(id));
  }

  // Creates a draft payment term; rules are added next and the term is published once they total 100%
  async create(data: CreatePaymentTermDto): Promise<CreateResponseDto<PaymentTermDto>> {
    await this.assertNameFree(data.name);
    const entity = await this.repository.create({
      name: data.name,
      baseline: data.baseline,
      description: data.description ?? null,
    });
    this.logger.log(`Created payment term: ${entity.name} (${entity.id})`);
    return {
      success: true,
      message: `Payment term "${entity.name}" created as a draft.`,
      data: PaymentTermDto.from(entity),
    };
  }

  // Updates a draft's name, baseline or description, keeping its name unique
  async update(id: string, data: Omit<UpdatePaymentTermDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.findDraftOrThrow(id);
    if (data.name !== undefined && data.name !== existing.name) await this.assertNameFree(data.name, id);
    await this.repository.update(id, data);
    this.logger.log(`Updated payment term: ${existing.name} (${id})`);
    return { success: true, message: `Payment term "${data.name ?? existing.name}" updated successfully.` };
  }

  // Moves when a draft's due days start counting; every rule's due date shifts with it
  async changeBaseline(id: string, baseline: PaymentTermBaseline): Promise<SuccessResponseDto> {
    const existing = await this.findDraftOrThrow(id);
    await this.repository.update(id, { baseline });
    this.logger.log(`Changed payment term baseline: ${existing.name} (${id}) → ${baseline}`);
    return { success: true, message: `Baseline of "${existing.name}" updated.` };
  }

  // Publishes a draft once it has at least one rule and its rules total exactly 100%, making it selectable
  async publish(id: string): Promise<SuccessResponseDto> {
    const term = await this.findDetailOrThrow(id);
    if (term.isPublished) {
      return { success: true, message: `Payment term "${term.name}" is already published.` };
    }
    if (term.ruleCount === 0) {
      throw new BadRequestException({
        label: 'No rules',
        detail: 'Add at least one rule before publishing this payment term.',
      });
    }
    const total = new Decimal(term.totalPercent);
    if (!total.equals(100)) {
      throw new BadRequestException({
        label: 'Rules must total 100%',
        detail: `The rules add up to ${total.toString()}% of the invoice. Adjust them to total exactly 100%.`,
      });
    }
    await this.repository.update(id, { isPublished: true });
    this.logger.log(`Published payment term: ${term.name} (${id})`);
    return { success: true, message: `Payment term "${term.name}" is now published.` };
  }

  // Returns a published term to draft so it can be edited; a term a supplier uses stays published
  async unpublish(id: string): Promise<SuccessResponseDto> {
    const term = await this.findDetailOrThrow(id);
    if (!term.isPublished) {
      return { success: true, message: `Payment term "${term.name}" is already a draft.` };
    }
    this.assertNotInUse(term, 'unpublish');
    await this.repository.update(id, { isPublished: false });
    this.logger.log(`Unpublished payment term: ${term.name} (${id})`);
    return { success: true, message: `Payment term "${term.name}" is now a draft.` };
  }

  // Deletes a payment term unless a supplier uses it, as its default or on a site enrollment
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.findDetailOrThrow(id);
    this.assertNotInUse(existing, 'delete');
    await this.repository.delete(id);
    this.logger.log(`Deleted payment term: ${existing.name} (${id})`);
    return { success: true, message: `Payment term "${existing.name}" deleted successfully.` };
  }

  // A published term is in use or may be picked at any moment; unpublish it to edit
  async findDraftOrThrow(id: string): Promise<PaymentTerm> {
    const draft = await this.repository.findDraft(id);
    if (draft) return draft;
    throw new BadRequestException({
      label: 'Payment term is published',
      detail: 'Unpublish the payment term before editing it.',
    });
  }

  // Loads a payment term with its rule count, rule total and the suppliers using it, throwing when it is out of reach
  private async findDetailOrThrow(id: string): Promise<PaymentTermDetail> {
    const term = await this.repository.findDetail(id);
    if (!term) throw new NotFoundException('Payment term not found.');
    return term;
  }

  // Names are unique per org regardless of case — they are what pickers show
  private async assertNameFree(name: string, excludeId?: string): Promise<void> {
    const isTaken = await this.repository.isNameTaken(name, excludeId);
    if (!isTaken) return;
    throw new ConflictException({
      label: 'Name already used',
      detail: `A payment term named "${name}" already exists.`,
      errors: [{ field: 'name', message: 'Already used by another payment term' }],
    });
  }

  // Suppliers depend on a term they use as their default or on a site enrollment; the detail returns both counts
  private assertNotInUse(term: PaymentTermDetail, action: 'delete' | 'unpublish'): void {
    if (term.supplierCount === 0 && term.enrollmentCount === 0) return;
    throw new ConflictException({
      label: 'Payment term in use',
      detail: `Suppliers use this payment term. Move them to another payment term before you ${action} it.`,
    });
  }
}
