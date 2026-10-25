import type { AddBomLineDto, UpdateBomLineDto } from '@commerce/offerings/dto/request/bom-line.dto';
import type { BulkClearVariantsTaxClassDto } from '@commerce/offerings/dto/request/bulk-clear-variants-tax-class.dto';
import type { BulkSetOfferingStatusDto } from '@commerce/offerings/dto/request/bulk-set-offering-status.dto';
import type { BulkSetVariantsAttributeDto } from '@commerce/offerings/dto/request/bulk-set-variants-attribute.dto';
import type { BulkSetVariantsStatusDto } from '@commerce/offerings/dto/request/bulk-set-variants-status.dto';
import type { BulkSetVariantsTaxClassDto } from '@commerce/offerings/dto/request/bulk-set-variants-tax-class.dto';
import type { CreateOfferingDto } from '@commerce/offerings/dto/request/create-offering.dto';
import type { CreateOfferingAttributeDto } from '@commerce/offerings/dto/request/create-offering-attribute.dto';
import type { CreateOfferingAttributeWithValuesAndTemplateDto } from '@commerce/offerings/dto/request/create-offering-attribute-with-values-and-template.dto';
import type { CreateOfferingDimensionDto } from '@commerce/offerings/dto/request/create-offering-dimension.dto';
import type { CreateOfferingDimensionWithValuesAndTemplateDto } from '@commerce/offerings/dto/request/create-offering-dimension-with-values-and-template.dto';
import type { CreateVariantDto } from '@commerce/offerings/dto/request/create-variant.dto';
import type { CreateVariantInventoryItemDto } from '@commerce/offerings/dto/request/create-variant-inventory-item.dto';
import type { GenerateVariantsDto } from '@commerce/offerings/dto/request/generate-variants.dto';
import type { SetFulfilmentDto } from '@commerce/offerings/dto/request/set-fulfilment.dto';
import type { SetTaxClassDto } from '@commerce/offerings/dto/request/set-tax-class.dto';
import type { SetVariantAttributesDto } from '@commerce/offerings/dto/request/set-variant-attributes.dto';
import type { UpdateOfferingDto } from '@commerce/offerings/dto/request/update-offering.dto';
import type { UpdateOfferingAttributeDto } from '@commerce/offerings/dto/request/update-offering-attribute.dto';
import type { UpdateOfferingDimensionDto } from '@commerce/offerings/dto/request/update-offering-dimension.dto';
import type { UpdateVariantDto } from '@commerce/offerings/dto/request/update-variant.dto';
import type { UpsertOfferingAttributeValuesDto } from '@commerce/offerings/dto/request/upsert-offering-attribute-values.dto';
import type { UpsertOfferingDimensionValuesDto } from '@commerce/offerings/dto/request/upsert-offering-dimension-values.dto';
import type { OfferingAttributeResponseDto } from '@commerce/offerings/dto/response/offering-attribute-response.dto';
import type {
  ChannelVariantPagesTableResponseDto,
  ChannelVariantResponseDto,
  OfferingChannelTargetResponseDto,
  OfferingChannelTypeResponseDto,
  OfferingTargetRow,
} from '@commerce/offerings/dto/response/offering-channel-response.dto';
import { OFFERING_CHANNEL_TYPES } from '@commerce/offerings/dto/response/offering-channel-response.dto';
import type { OfferingDimensionResponseDto } from '@commerce/offerings/dto/response/offering-dimension-response.dto';
import type { OfferingResponseDto } from '@commerce/offerings/dto/response/offering-response.dto';
import type { OfferingTableResponseDto } from '@commerce/offerings/dto/response/offering-table-response.dto';
import type { OfferingVariantResponseDto } from '@commerce/offerings/dto/response/offering-variant-response.dto';
import type { OfferingVariantTableResponseDto } from '@commerce/offerings/dto/response/offering-variant-table-response.dto';
import type { VariantBomResponseDto } from '@commerce/offerings/dto/response/variant-bom-response.dto';
import { AppDomainRepository } from '@domain/app/repositories/app.repository';
import { AppStorefrontDomainService, type StorefrontCreateResult } from '@domain/app/services/app-storefront.service';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { BadGatewayException, BadRequestException, ConflictException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';
import type { PreviewCombinationsDto } from '../../../domain/offerings/dto/request/preview-combinations.dto';
import type { VariantCombinationsResponseDto } from '../../../domain/offerings/dto/response/variant-combinations-response.dto';
import type { OfferingVariantOptions } from '../graphql/offering-variant-option.type';

const EXPORT_PAGE_SIZE = 500;
const MAX_EXPORT_ROWS = 50_000;

@Injectable()
export class OrgOfferingsGatewayService {
  private readonly logger = new Logger(OrgOfferingsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly ownerNames: OwnerNameService,
    private readonly appRepository: AppDomainRepository,
    private readonly appStorefront: AppStorefrontDomainService,
  ) {}

  // Returns paginated offerings for the data table, merged with the caller's saved view state
  async findForTable(orgId: string, userId: string): Promise<OfferingTableResponseDto> {
    this.logger.log('org.offerings.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-org-offerings');

    const { result, count } = await this.nats.send<{ result: OfferingResponseDto[]; count: number }>(
      'commerce',
      'org.offerings.table',
      state,
    );

    return { result: await this.ownerNames.resolve(orgId, result), count, state, activeViewId };
  }

  // Variants of one offering, merged with the caller's saved view for THAT offering's table
  async findVariantById(variantId: string): Promise<OfferingVariantResponseDto> {
    this.logger.log(`org.offerings.variants.findById — id: ${variantId}`);
    return this.nats.send('commerce', 'org.offerings.variants.findById', { id: variantId });
  }

  async findVariantsForTable(userId: string, offeringId: string): Promise<OfferingVariantTableResponseDto> {
    this.logger.log(`org.offerings.variants.table — offeringId: ${offeringId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-offering-${offeringId}-variants`,
    );

    const { result, count } = await this.nats.send<{ result: OfferingVariantResponseDto[]; count: number }>(
      'commerce',
      'org.offerings.variants.table',
      { offeringId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  async findById(orgId: string, id: string): Promise<OfferingResponseDto> {
    this.logger.log(`org.offerings.findById — id: ${id}`);
    const offering = await this.nats.send<OfferingResponseDto>('commerce', 'org.offerings.findById', { id });
    const [withOwner] = await this.ownerNames.resolve(orgId, [offering]);
    return withOwner;
  }

  async create(dto: CreateOfferingDto): Promise<CreateResponseDto<OfferingResponseDto>> {
    this.logger.log(`offerings.create — code: ${dto.code}`);
    return this.nats.send('commerce', 'org.offerings.create', dto);
  }

  async update(id: string, dto: UpdateOfferingDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.update — id: ${id}`);
    return this.nats.send('commerce', 'org.offerings.update', { id, ...dto });
  }

  // The microservice refuses this while the offering has no variants
  async setStatus(id: string, isActive: boolean): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.setStatus — id: ${id}, isActive: ${isActive}`);
    return this.nats.send('commerce', 'org.offerings.setStatus', { id, isActive });
  }

  async bulkSetStatus(dto: BulkSetOfferingStatusDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.bulkSetStatus — count: ${dto.ids.length}, isActive: ${dto.isActive}`);
    return this.nats.send('commerce', 'org.offerings.bulkSetStatus', dto);
  }

  // Rows only — the workbook is built here, so nothing binary crosses NATS
  async exportOfferingRows(): Promise<Record<string, unknown>[]> {
    this.logger.log('offerings.exportRows');
    return this.collectExportPages((page) => this.nats.send('commerce', 'org.offerings.exportRows', page));
  }

  async exportVariantRows(offeringId: string): Promise<Record<string, unknown>[]> {
    this.logger.log(`offerings.variants.exportRows — offeringId: ${offeringId}`);
    return this.collectExportPages((page) =>
      this.nats.send('commerce', 'org.offerings.variants.exportRows', { offeringId, ...page }),
    );
  }

  // Walks pages until a short one arrives, since one NATS reply is capped at 1 MB
  private async collectExportPages(
    fetchPage: (page: { limit: number; offset: number }) => Promise<Record<string, unknown>[]>,
  ): Promise<Record<string, unknown>[]> {
    const all: Record<string, unknown>[] = [];
    for (let offset = 0; ; offset += EXPORT_PAGE_SIZE) {
      const rows = await fetchPage({ limit: EXPORT_PAGE_SIZE, offset });
      all.push(...rows);
      if (rows.length < EXPORT_PAGE_SIZE) return all;
      if (all.length >= MAX_EXPORT_ROWS) {
        throw new ConflictException({
          label: 'Export Too Large',
          detail: `This export exceeds ${MAX_EXPORT_ROWS.toLocaleString()} rows. Narrow the filters and try again.`,
        });
      }
    }
  }

  async bulkClearVariantsTaxClass(offeringId: string, dto: BulkClearVariantsTaxClassDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bulkClearTaxClass — count: ${dto.ids.length}`);
    return this.nats.send('commerce', 'org.offerings.variants.bulkClearTaxClass', { offeringId, ...dto });
  }

  async bulkSetVariantsTaxClass(offeringId: string, dto: BulkSetVariantsTaxClassDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bulkSetTaxClass — count: ${dto.ids.length}, taxClassId: ${dto.taxClassId}`);
    return this.nats.send('commerce', 'org.offerings.variants.bulkSetTaxClass', { offeringId, ...dto });
  }

  async bulkSetVariantsStatus(offeringId: string, dto: BulkSetVariantsStatusDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bulkSetStatus — count: ${dto.ids.length}, isActive: ${dto.isActive}`);
    return this.nats.send('commerce', 'org.offerings.variants.bulkSetStatus', { offeringId, ...dto });
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.offerings.delete', { id });
  }

  // Returns an offering's dimensions with their values, in code segment order
  async listDimensions(offeringId: string): Promise<OfferingDimensionResponseDto[]> {
    this.logger.log(`offerings.dimensions.list — offeringId: ${offeringId}`);
    return this.nats.send('commerce', 'org.offerings.dimensions.list', { offeringId });
  }

  // Appends a dimension seeded from a template — the copy keeps no link back to the template
  async createDimension(
    offeringId: string,
    dto: CreateOfferingDimensionDto,
  ): Promise<CreateResponseDto<OfferingDimensionResponseDto>> {
    this.logger.log(`offerings.dimensions.create — offeringId: ${offeringId}, code: ${dto.code}`);
    return this.nats.send('commerce', 'org.offerings.dimensions.create', { offeringId, ...dto });
  }

  // The template supplies code, name and values — the microservice copies them
  async createDimensionWithValuesAndTemplate(
    offeringId: string,
    dto: CreateOfferingDimensionWithValuesAndTemplateDto,
  ): Promise<CreateResponseDto<OfferingDimensionResponseDto>> {
    this.logger.log(`org.offerings.dimensions.createWithValuesAndTemplate — ${dto.code}, ${dto.values.length} values`);
    return this.nats.send('commerce', 'org.offerings.dimensions.createWithValuesAndTemplate', { offeringId, ...dto });
  }

  async reorderDimensions(offeringId: string, dimensionIds: string[]): Promise<SuccessResponseDto> {
    this.logger.log(`org.offerings.dimensions.reorder — offeringId: ${offeringId}`);
    return this.nats.send('commerce', 'org.offerings.dimensions.reorder', { offeringId, dimensionIds });
  }

  async upsertDimensionValues(dimensionId: string, dto: UpsertOfferingDimensionValuesDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.offerings.dimensions.values.upsert — dimensionId: ${dimensionId}`);
    return this.nats.send('commerce', 'org.offerings.dimensions.values.upsert', { dimensionId, ...dto });
  }

  async updateDimension(dimensionId: string, dto: UpdateOfferingDimensionDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.dimensions.update — id: ${dimensionId}`);
    return this.nats.send('commerce', 'org.offerings.dimensions.update', { id: dimensionId, ...dto });
  }

  async deleteDimension(dimensionId: string): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.dimensions.delete — id: ${dimensionId}`);
    return this.nats.send('commerce', 'org.offerings.dimensions.delete', { id: dimensionId });
  }

  // Returns an offering's attributes with their values
  async listAttributes(offeringId: string): Promise<OfferingAttributeResponseDto[]> {
    this.logger.log(`offerings.attributes.list — offeringId: ${offeringId}`);
    return this.nats.send('commerce', 'org.offerings.attributes.list', { offeringId });
  }

  // Appends an attribute seeded from a template — the copy keeps no link back to the template
  async createAttribute(
    offeringId: string,
    dto: CreateOfferingAttributeDto,
  ): Promise<CreateResponseDto<OfferingAttributeResponseDto>> {
    this.logger.log(`offerings.attributes.create — offeringId: ${offeringId}, code: ${dto.code}`);
    return this.nats.send('commerce', 'org.offerings.attributes.create', { offeringId, ...dto });
  }

  // The template supplies code, name and values — the microservice copies them
  async createAttributeWithValuesAndTemplate(
    offeringId: string,
    dto: CreateOfferingAttributeWithValuesAndTemplateDto,
  ): Promise<CreateResponseDto<OfferingAttributeResponseDto>> {
    this.logger.log(`org.offerings.attributes.createWithValuesAndTemplate — ${dto.code}, ${dto.values.length} values`);
    return this.nats.send('commerce', 'org.offerings.attributes.createWithValuesAndTemplate', { offeringId, ...dto });
  }

  async reorderAttributes(offeringId: string, attributeIds: string[]): Promise<SuccessResponseDto> {
    this.logger.log(`org.offerings.attributes.reorder — offeringId: ${offeringId}`);
    return this.nats.send('commerce', 'org.offerings.attributes.reorder', { offeringId, attributeIds });
  }

  async upsertAttributeValues(attributeId: string, dto: UpsertOfferingAttributeValuesDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.offerings.attributes.values.upsert — attributeId: ${attributeId}`);
    return this.nats.send('commerce', 'org.offerings.attributes.values.upsert', { attributeId, ...dto });
  }

  async updateAttribute(attributeId: string, dto: UpdateOfferingAttributeDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.attributes.update — id: ${attributeId}`);
    return this.nats.send('commerce', 'org.offerings.attributes.update', { id: attributeId, ...dto });
  }

  async deleteAttribute(attributeId: string): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.attributes.delete — id: ${attributeId}`);
    return this.nats.send('commerce', 'org.offerings.attributes.delete', { id: attributeId });
  }

  // Returns an offering's variants with their dimension values and bill of materials

  // Additive — combinations that already exist are skipped, never recreated or removed
  async previewVariantCombinations(
    offeringId: string,
    dto: PreviewCombinationsDto,
  ): Promise<VariantCombinationsResponseDto> {
    this.logger.log(`offerings.variants.combinations — offeringId: ${offeringId}, axes: ${dto.axes.length}`);
    return this.nats.send('commerce', 'org.offerings.variants.combinations', { offeringId, ...dto });
  }

  async generateVariants(offeringId: string, dto: GenerateVariantsDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.generate — offeringId: ${offeringId}, count: ${dto.combinations.length}`);
    return this.nats.send('commerce', 'org.offerings.variants.generate', { offeringId, ...dto });
  }

  async createVariant(
    offeringId: string,
    dto: CreateVariantDto,
  ): Promise<CreateResponseDto<OfferingVariantResponseDto>> {
    this.logger.log(`offerings.variants.create — offeringId: ${offeringId}`);
    return this.nats.send('commerce', 'org.offerings.variants.create', { offeringId, ...dto });
  }

  async updateVariant(variantId: string, dto: UpdateVariantDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.update — id: ${variantId}`);
    return this.nats.send('commerce', 'org.offerings.variants.update', { id: variantId, ...dto });
  }

  // Replaces a variant's bill of materials as a set Creates the inventory item this variant resolves to and links it as
  // the variant's component
  async createInventoryItem(
    variantId: string,
    dto: CreateVariantInventoryItemDto,
  ): Promise<CreateResponseDto<OfferingVariantResponseDto>> {
    this.logger.log(`offerings.variants.createInventoryItem — variantId: ${variantId}`);
    return this.nats.send('commerce', 'org.offerings.variants.createInventoryItem', { variantId, ...dto });
  }

  // Cascades to every variant that has not pinned its own tax class Changes what the offering is; the microservice
  // cascades to variants that have not pinned their own
  async setFulfilment(id: string, dto: SetFulfilmentDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.offerings.setFulfilment — id: ${id}, type: ${dto.fulfilmentType}`);
    return this.nats.send('commerce', 'org.offerings.setFulfilment', { id, ...dto });
  }

  // Pins one variant's own fulfilment type, exempting it from the offering's cascade
  async setVariantFulfilment(variantId: string, dto: SetFulfilmentDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.offerings.variants.setFulfilment — id: ${variantId}, type: ${dto.fulfilmentType}`);
    return this.nats.send('commerce', 'org.offerings.variants.setFulfilment', { id: variantId, ...dto });
  }

  // Drops the override so the variant follows its offering again
  async clearVariantFulfilment(variantId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.offerings.variants.clearFulfilment — id: ${variantId}`);
    return this.nats.send('commerce', 'org.offerings.variants.clearFulfilment', { id: variantId });
  }

  async setTaxClass(id: string, dto: SetTaxClassDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.setTaxClass — id: ${id}`);
    return this.nats.send('commerce', 'org.offerings.setTaxClass', { id, ...dto });
  }

  // Flat value ids: the attribute each belongs to is derived by the microservice from the offering Only the named
  // attribute is replaced; the microservice leaves the selection's other attributes alone
  async bulkSetVariantsAttribute(offeringId: string, dto: BulkSetVariantsAttributeDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bulkSetAttribute — count: ${dto.ids.length}, attributeId: ${dto.attributeId}`);
    return this.nats.send('commerce', 'org.offerings.variants.bulkSetAttribute', { offeringId, ...dto });
  }

  async setVariantAttributes(variantId: string, dto: SetVariantAttributesDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.setAttributes — id: ${variantId}, values: ${dto.valueIds.length}`);
    return this.nats.send('commerce', 'org.offerings.variants.setAttributes', { id: variantId, ...dto });
  }

  async setVariantTaxClass(variantId: string, dto: SetTaxClassDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.setTaxClass — id: ${variantId}`);
    return this.nats.send('commerce', 'org.offerings.variants.setTaxClass', { id: variantId, ...dto });
  }

  async clearVariantTaxClass(variantId: string): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.clearTaxClass — id: ${variantId}`);
    return this.nats.send('commerce', 'org.offerings.variants.clearTaxClass', { id: variantId });
  }

  // One component at a time — the whole-list replace it supersedes could silently drop a concurrent edit The components
  // plus the code-matched suggestion, read on its own rather than with the variant
  findVariantBom(variantId: string): Promise<VariantBomResponseDto> {
    this.logger.log(`offerings.variants.bom.lines.list — variantId: ${variantId}`);
    return this.nats.send('commerce', 'org.offerings.variants.bom.lines.list', { variantId });
  }

  async addBomLine(variantId: string, dto: AddBomLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.lines.add — variantId: ${variantId}`);
    return this.nats.send('commerce', 'org.offerings.variants.bom.lines.add', { variantId, ...dto });
  }

  async updateBomLine(lineId: string, dto: UpdateBomLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.lines.update — id: ${lineId}`);
    return this.nats.send('commerce', 'org.offerings.variants.bom.lines.update', { id: lineId, ...dto });
  }

  async deleteBomLine(lineId: string): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.lines.delete — id: ${lineId}`);
    return this.nats.send('commerce', 'org.offerings.variants.bom.lines.delete', { id: lineId });
  }

  // Links the item already carrying this variant's code; the item is resolved server-side
  async addSuggestedComponent(variantId: string): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.addSuggested — variantId: ${variantId}`);
    return this.nats.send('commerce', 'org.offerings.variants.bom.addSuggested', { variantId });
  }

  async deleteVariant(variantId: string): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.delete — id: ${variantId}`);
    return this.nats.send('commerce', 'org.offerings.variants.delete', { id: variantId });
  }

  // Variant options for a storefront's own picker — org-wide, since an app credential carries no site
  async appVariantOptions(query: {
    search?: string;
    excludeIds?: string[];
    limit?: number;
    offset?: number;
  }): Promise<OfferingVariantOptions> {
    this.logger.log(`org.offerings.variants.appOptions — search: ${query.search ?? ''}`);
    return this.nats.send('commerce', 'org.offerings.variants.appOptions', query);
  }

  // Where this offering sells. Commerce ranks each app or till against the channels in reach and counts what
  // the winning channel's catalog carries of this offering; core names the apps, since apps are its own.
  // Grouped by channel type, the way the channels screen groups them. No storefront is asked anything here.
  async offeringChannels(orgId: string, offeringId: string): Promise<OfferingChannelTypeResponseDto[]> {
    const targets = await this.offeringTargets(orgId, offeringId);
    const byType = new Map<string, OfferingChannelTargetResponseDto[]>();

    for (const target of targets) {
      const rows = byType.get(target.type) ?? [];
      rows.push(target.row);
      byType.set(target.type, rows);
    }

    return [...byType].map(([type, rows]) => ({ type, targets: rows }));
  }

  // Every target of this offering, paired with the one fact only this gateway needs: whether this workspace
  // owns the channel the target resolves through. That does not belong in the list a client reads.
  private async offeringTargets(
    orgId: string,
    offeringId: string,
  ): Promise<{ type: string; row: OfferingChannelTargetResponseDto; isOwn: boolean }[]> {
    const apps = await this.appRepository.findAllByOrg(orgId);
    const live = apps.filter((app) => !app.revokedAt);

    this.logger.log(`org.offerings.channels — offeringId: ${offeringId}, apps: ${live.length}`);
    const targets = await this.nats.send<OfferingTargetRow[]>('commerce', 'org.offerings.channels', {
      offeringId,
      appIds: live.map((app) => app.id),
    });

    const named = new Map(live.map((app) => [app.id, app]));

    return targets.map((target) => {
      const app = target.targetKind === 'APP' ? named.get(target.targetId) : undefined;

      return {
        type: target.type,
        isOwn: target.isOwn,
        row: {
          targetId: target.targetId,
          targetKind: target.targetKind,
          // Commerce names a till; an app is core's to name
          name: app?.name ?? target.targetName,
          catalogId: target.catalogId,
          catalogName: target.catalogName,
          isAssigned: target.isAssigned,
          // Only an app with a base url has pages to ask about; a till never does
          storefront: Boolean(app?.baseUrl),
          variants: target.variants,
          listed: target.listed,
          available: target.available,
        },
      };
    });
  }

  // The Variants table seen through one target: the same rows, columns and saved view as the Variants tab,
  // plus what its channel carries, what it offers that target, and — where the target is an app with a base
  // url — the page behind it. Its own slug, so switching targets does not inherit that tab's view.
  //
  // Both ids come from the path, so nothing is re-resolved: commerce answers with the channel facts it
  // already had, and core looks up the one app it needs rather than the organization's whole list.
  async channelVariantPages(
    orgId: string,
    userId: string,
    offeringId: string,
    channelType: string,
    targetId: string,
  ): Promise<ChannelVariantPagesTableResponseDto> {
    this.requireChannelType(channelType);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-offering-${offeringId}-target-${targetId}-variants`,
    );

    this.logger.log(`org.offerings.variants.channelTable — offeringId: ${offeringId}, target: ${targetId}`);
    const { result, count, catalogName, isOwn } = await this.nats.send<{
      result: ChannelVariantResponseDto[];
      count: number;
      catalogName: string;
      isOwn: boolean;
    }>('commerce', 'org.offerings.variants.channelTable', {
      offeringId,
      channelType,
      targetId,
      ...state,
    });

    // A target id that names no app of this organization is a till, which has no storefront to ask
    const app = await this.appRepository.findByIdInOrg(targetId, orgId);
    const appId = app?.baseUrl ? app.id : null;

    const statuses = appId
      ? await this.appStorefront.productStatusesInChunks(
          appId,
          orgId,
          result.map((row) => row.code),
        )
      : {};

    // Null rather than false wherever nothing could be asked, so the table says "unknown" not "no page"
    const rows = result.map((row) => ({
      ...row,
      exists: appId ? (statuses[row.code]?.exists ?? null) : null,
      metadataComplete: appId ? (statuses[row.code]?.metadataComplete ?? null) : null,
    }));

    return { result: rows, count, state, activeViewId, storefront: Boolean(appId), catalogName, isOwn };
  }

  // Creates pages for the named variants on one target's storefront
  async createChannelPages(
    orgId: string,
    offeringId: string,
    channelType: string,
    targetId: string,
    variantCodes: string[],
  ): Promise<SuccessResponseDto> {
    this.requireChannelType(channelType);

    // A till names no app, so the lookup simply finds nothing and the refusal below is the right answer
    const app = await this.appRepository.findByIdInOrg(targetId, orgId);
    if (!app?.baseUrl) {
      throw new ConflictException({
        label: 'No Storefront',
        detail: 'This target has no storefront, so there are no pages to create on it.',
      });
    }

    // A page is named after this offering, so a code from any other offering would get the wrong name
    this.logger.log(
      `org.offerings.variants.codesInOffering — offeringId: ${offeringId}, codes: ${variantCodes.length}`,
    );
    const known = new Set(
      await this.nats.send<string[]>('commerce', 'org.offerings.variants.codesInOffering', {
        offeringId,
        codes: variantCodes,
      }),
    );
    const foreign = variantCodes.filter((code) => !known.has(code));
    if (foreign.length > 0) {
      throw new BadRequestException({
        label: 'Not In This Offering',
        detail: `No variant of this offering matches ${pluralize('code', foreign.length)}: ${foreign.join(', ')}.`,
      });
    }

    // Every page of one offering is named after it, so the name is read once rather than per variant
    const offering = await this.findById(orgId, offeringId);
    const products = variantCodes.map((code) => ({ code, name: offering.name }));

    this.logger.log(`channel pages — offering: ${offeringId}, target: ${targetId}, variants: ${products.length}`);
    const result = await this.appStorefront.createProductsInChunks(app.id, orgId, products);

    // Nothing created and something refused is a failure: reporting success would have the table say
    // "no page" straight after telling the operator the pages were made
    const refusedEverything = result.created.length === 0 && result.failed.length > 0;
    if (refusedEverything) {
      throw new BadGatewayException({
        label: 'Storefront Refused',
        detail: `The storefront could not create ${pluralize('page', result.failed.length, true)}: ${result.failed[0].error}`,
      });
    }

    return { success: true, message: this.channelPagesMessage(result) };
  }

  // Sets whether one variant is available on one target. Commerce owns the rule that a channel this workspace
  // does not own cannot be edited here, so this forwards and lets it answer.
  async setTargetAvailability(
    orgId: string,
    channelType: string,
    targetId: string,
    variantId: string,
    availableHere: boolean,
  ): Promise<SuccessResponseDto> {
    this.requireChannelType(channelType);

    // An app is core's to name; a till is named by commerce, which fills the blank in
    const app = await this.appRepository.findByIdInOrg(targetId, orgId);

    this.logger.log(`org.offerings.variants.setTargetAvailability — target: ${targetId}, variant: ${variantId}`);
    return this.nats.send('commerce', 'org.offerings.variants.setTargetAvailability', {
      channelType,
      targetId,
      targetName: app?.name ?? '',
      variantId,
      availableHere,
    });
  }

  // A channel type from the path, refused unless it is one commerce knows
  private requireChannelType(channelType: string): void {
    if (!(OFFERING_CHANNEL_TYPES as readonly string[]).includes(channelType)) {
      throw new BadRequestException(`Unknown channel type "${channelType}". Use ${OFFERING_CHANNEL_TYPES.join(', ')}.`);
    }
  }

  // What to tell the operator: created and skipped read differently, and a partial refusal must be said out loud
  private channelPagesMessage(result: StorefrontCreateResult): string {
    const parts: string[] = [];

    if (result.created.length > 0) {
      parts.push(`${pluralize('page', result.created.length, true)} created`);
    }
    if (result.skipped.length > 0) {
      parts.push(`${result.skipped.length} already had one`);
    }
    if (result.failed.length > 0) {
      parts.push(`${result.failed.length} refused by the storefront`);
    }

    if (parts.length === 0) {
      return 'The storefront reported nothing to do.';
    }
    return `${parts.join(', ')}.`;
  }
}
