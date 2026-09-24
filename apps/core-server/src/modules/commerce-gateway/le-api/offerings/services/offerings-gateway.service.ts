import type { AddBomLineDto, UpdateBomLineDto } from '@commerce/offerings/dto/request/bom-line.dto';
import type { BulkSetOfferingStatusDto } from '@commerce/offerings/dto/request/bulk-set-offering-status.dto';
import type { BulkSetVariantsStatusDto } from '@commerce/offerings/dto/request/bulk-set-variants-status.dto';
import type { CreateOfferingDto } from '@commerce/offerings/dto/request/create-offering.dto';
import type { CreateOfferingDimensionDto } from '@commerce/offerings/dto/request/create-offering-dimension.dto';
import type { CreateOfferingDimensionFromTemplateDto } from '@commerce/offerings/dto/request/create-offering-dimension-from-template.dto';
import type { CreateVariantDto } from '@commerce/offerings/dto/request/create-variant.dto';
import type { GenerateVariantsDto } from '@commerce/offerings/dto/request/generate-variants.dto';
import type { SetFulfilmentDto } from '@commerce/offerings/dto/request/set-fulfilment.dto';
import type { SetTaxClassDto } from '@commerce/offerings/dto/request/set-tax-class.dto';
import type { UpdateOfferingDto } from '@commerce/offerings/dto/request/update-offering.dto';
import type { UpdateOfferingDimensionDto } from '@commerce/offerings/dto/request/update-offering-dimension.dto';
import type { UpdateVariantDto } from '@commerce/offerings/dto/request/update-variant.dto';
import type { UpsertOfferingDimensionValuesDto } from '@commerce/offerings/dto/request/upsert-offering-dimension-values.dto';
import type { OfferingDimensionResponseDto } from '@commerce/offerings/dto/response/offering-dimension-response.dto';
import type { OfferingResponseDto } from '@commerce/offerings/dto/response/offering-response.dto';
import type { OfferingTableResponseDto } from '@commerce/offerings/dto/response/offering-table-response.dto';
import type { OfferingVariantResponseDto } from '@commerce/offerings/dto/response/offering-variant-response.dto';
import type { OfferingVariantTableResponseDto } from '@commerce/offerings/dto/response/offering-variant-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { OwnerNameService } from '@/owner-names/owner-name.service';
import type { PreviewCombinationsDto } from '../../../domain/offerings/dto/request/preview-combinations.dto';
import type { VariantCombinationsResponseDto } from '../../../domain/offerings/dto/response/variant-combinations-response.dto';

@Injectable()
export class LeOfferingsGatewayService {
  private readonly logger = new Logger(LeOfferingsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly ownerNames: OwnerNameService,
  ) {}

  // Returns paginated offerings for the data table, merged with the caller's saved view state
  async findForTable(orgId: string, userId: string): Promise<OfferingTableResponseDto> {
    this.logger.log('le.offerings.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-le-offerings');

    const { result, count } = await this.nats.send<{ result: OfferingResponseDto[]; count: number }>(
      'commerce',
      'le.offerings.table',
      state,
    );

    return { result: await this.ownerNames.resolve(orgId, result), count, state, activeViewId };
  }

  // Variants of one offering, merged with the caller's saved view for THAT offering's table
  async findVariantById(variantId: string): Promise<OfferingVariantResponseDto> {
    this.logger.log(`le.offerings.variants.findById — id: ${variantId}`);
    return this.nats.send('commerce', 'le.offerings.variants.findById', { id: variantId });
  }

  async findVariantsForTable(userId: string, offeringId: string): Promise<OfferingVariantTableResponseDto> {
    this.logger.log(`le.offerings.variants.table — offeringId: ${offeringId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-le-offering-${offeringId}-variants`,
    );

    const { result, count } = await this.nats.send<{ result: OfferingVariantResponseDto[]; count: number }>(
      'commerce',
      'le.offerings.variants.table',
      { offeringId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  async findById(orgId: string, id: string): Promise<OfferingResponseDto> {
    this.logger.log(`le.offerings.findById — id: ${id}`);
    const offering = await this.nats.send<OfferingResponseDto>('commerce', 'le.offerings.findById', { id });
    const [withOwner] = await this.ownerNames.resolve(orgId, [offering]);
    return withOwner;
  }

  async create(dto: CreateOfferingDto): Promise<CreateResponseDto<OfferingResponseDto>> {
    this.logger.log(`offerings.create — code: ${dto.code}`);
    return this.nats.send('commerce', 'le.offerings.create', dto);
  }

  async update(id: string, dto: UpdateOfferingDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.update — id: ${id}`);
    return this.nats.send('commerce', 'le.offerings.update', { id, ...dto });
  }

  // The microservice refuses this while the offering has no variants
  async setStatus(id: string, isActive: boolean): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.setStatus — id: ${id}, isActive: ${isActive}`);
    return this.nats.send('commerce', 'le.offerings.setStatus', { id, isActive });
  }

  async bulkSetStatus(dto: BulkSetOfferingStatusDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.bulkSetStatus — count: ${dto.ids.length}, isActive: ${dto.isActive}`);
    return this.nats.send('commerce', 'le.offerings.bulkSetStatus', dto);
  }

  async bulkSetVariantsStatus(offeringId: string, dto: BulkSetVariantsStatusDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bulkSetStatus — count: ${dto.ids.length}, isActive: ${dto.isActive}`);
    return this.nats.send('commerce', 'le.offerings.variants.bulkSetStatus', { offeringId, ...dto });
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.delete — id: ${id}`);
    return this.nats.send('commerce', 'le.offerings.delete', { id });
  }

  // Returns an offering's dimensions with their values, in SKU segment order
  async listDimensions(offeringId: string): Promise<OfferingDimensionResponseDto[]> {
    this.logger.log(`offerings.dimensions.list — offeringId: ${offeringId}`);
    return this.nats.send('commerce', 'le.offerings.dimensions.list', { offeringId });
  }

  // Appends a dimension seeded from a template — the copy keeps no link back to the template
  async createDimension(
    offeringId: string,
    dto: CreateOfferingDimensionDto,
  ): Promise<CreateResponseDto<OfferingDimensionResponseDto>> {
    this.logger.log(`offerings.dimensions.create — offeringId: ${offeringId}, code: ${dto.code}`);
    return this.nats.send('commerce', 'le.offerings.dimensions.create', { offeringId, ...dto });
  }

  // The template supplies code, name and values — the microservice copies them
  async createDimensionFromTemplate(
    offeringId: string,
    dto: CreateOfferingDimensionFromTemplateDto,
  ): Promise<CreateResponseDto<OfferingDimensionResponseDto>> {
    this.logger.log(`le.offerings.dimensions.createFromTemplate — templateId: ${dto.templateId}`);
    return this.nats.send('commerce', 'le.offerings.dimensions.createFromTemplate', { offeringId, ...dto });
  }

  async reorderDimensions(offeringId: string, dimensionIds: string[]): Promise<SuccessResponseDto> {
    this.logger.log(`le.offerings.dimensions.reorder — offeringId: ${offeringId}`);
    return this.nats.send('commerce', 'le.offerings.dimensions.reorder', { offeringId, dimensionIds });
  }

  async upsertDimensionValues(dimensionId: string, dto: UpsertOfferingDimensionValuesDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.offerings.dimensions.values.upsert — dimensionId: ${dimensionId}`);
    return this.nats.send('commerce', 'le.offerings.dimensions.values.upsert', { dimensionId, ...dto });
  }

  async updateDimension(dimensionId: string, dto: UpdateOfferingDimensionDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.dimensions.update — id: ${dimensionId}`);
    return this.nats.send('commerce', 'le.offerings.dimensions.update', { id: dimensionId, ...dto });
  }

  async deleteDimension(dimensionId: string): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.dimensions.delete — id: ${dimensionId}`);
    return this.nats.send('commerce', 'le.offerings.dimensions.delete', { id: dimensionId });
  }

  // Returns an offering's variants with their dimension values and bill of materials

  // Additive — combinations that already exist are skipped, never recreated or removed
  async previewVariantCombinations(
    offeringId: string,
    dto: PreviewCombinationsDto,
  ): Promise<VariantCombinationsResponseDto> {
    this.logger.log(`offerings.variants.combinations — offeringId: ${offeringId}, axes: ${dto.axes.length}`);
    return this.nats.send('commerce', 'le.offerings.variants.combinations', { offeringId, ...dto });
  }

  async generateVariants(offeringId: string, dto: GenerateVariantsDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.generate — offeringId: ${offeringId}, count: ${dto.combinations.length}`);
    return this.nats.send('commerce', 'le.offerings.variants.generate', { offeringId, ...dto });
  }

  async createVariant(
    offeringId: string,
    dto: CreateVariantDto,
  ): Promise<CreateResponseDto<OfferingVariantResponseDto>> {
    this.logger.log(`offerings.variants.create — offeringId: ${offeringId}`);
    return this.nats.send('commerce', 'le.offerings.variants.create', { offeringId, ...dto });
  }

  async updateVariant(variantId: string, dto: UpdateVariantDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.update — id: ${variantId}`);
    return this.nats.send('commerce', 'le.offerings.variants.update', { id: variantId, ...dto });
  }

  // Replaces a variant's bill of materials as a set
  // Cascades to every variant that has not pinned its own tax class
  // Changes what the offering is; the microservice cascades to variants that have not pinned their own
  async setFulfilment(id: string, dto: SetFulfilmentDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.offerings.setFulfilment — id: ${id}, type: ${dto.fulfilmentType}`);
    return this.nats.send('commerce', 'le.offerings.setFulfilment', { id, ...dto });
  }

  // Pins one variant's own fulfilment type, exempting it from the offering's cascade
  async setVariantFulfilment(variantId: string, dto: SetFulfilmentDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.offerings.variants.setFulfilment — id: ${variantId}, type: ${dto.fulfilmentType}`);
    return this.nats.send('commerce', 'le.offerings.variants.setFulfilment', { id: variantId, ...dto });
  }

  // Drops the override so the variant follows its offering again
  async clearVariantFulfilment(variantId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.offerings.variants.clearFulfilment — id: ${variantId}`);
    return this.nats.send('commerce', 'le.offerings.variants.clearFulfilment', { id: variantId });
  }

  async setTaxClass(id: string, dto: SetTaxClassDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.setTaxClass — id: ${id}`);
    return this.nats.send('commerce', 'le.offerings.setTaxClass', { id, ...dto });
  }

  async setVariantTaxClass(variantId: string, dto: SetTaxClassDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.setTaxClass — id: ${variantId}`);
    return this.nats.send('commerce', 'le.offerings.variants.setTaxClass', { id: variantId, ...dto });
  }

  async clearVariantTaxClass(variantId: string): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.clearTaxClass — id: ${variantId}`);
    return this.nats.send('commerce', 'le.offerings.variants.clearTaxClass', { id: variantId });
  }

  // One component at a time — the whole-list replace it supersedes could silently drop a concurrent edit
  async addBomLine(variantId: string, dto: AddBomLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.lines.add — variantId: ${variantId}`);
    return this.nats.send('commerce', 'le.offerings.variants.bom.lines.add', { variantId, ...dto });
  }

  async updateBomLine(lineId: string, dto: UpdateBomLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.lines.update — id: ${lineId}`);
    return this.nats.send('commerce', 'le.offerings.variants.bom.lines.update', { id: lineId, ...dto });
  }

  async deleteBomLine(lineId: string): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.lines.delete — id: ${lineId}`);
    return this.nats.send('commerce', 'le.offerings.variants.bom.lines.delete', { id: lineId });
  }

  // Links the item already carrying this variant's SKU; the item is resolved server-side
  async addSuggestedComponent(variantId: string): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.addSuggested — variantId: ${variantId}`);
    return this.nats.send('commerce', 'le.offerings.variants.bom.addSuggested', { variantId });
  }

  async deleteVariant(variantId: string): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.delete — id: ${variantId}`);
    return this.nats.send('commerce', 'le.offerings.variants.delete', { id: variantId });
  }
}
