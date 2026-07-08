import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
} from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { BusinessUnitService } from '@/modules/domain/business-unit/services/business-unit.service';
import type { AssignCatalogChannelDto } from '../dto/request/assign-catalog-channel.dto';
import type { CreateCatalogDto } from '../dto/request/create-catalog.dto';
import type { CreateModifierGroupDto } from '../dto/request/create-modifier-group.dto';
import type { CreateModifierOptionDto } from '../dto/request/create-modifier-option.dto';
import type { CreateOfferingDto } from '../dto/request/create-offering.dto';
import type { CreateVariantDto } from '../dto/request/create-variant.dto';
import type { CreateVariantOptionDto } from '../dto/request/create-variant-option.dto';
import type { SaveOfferingModifiersDto } from '../dto/request/save-offering-modifiers.dto';
import type { UpdateCatalogDto } from '../dto/request/update-catalog.dto';
import type { UpdateModifierGroupDto } from '../dto/request/update-modifier-group.dto';
import type { UpdateModifierOptionDto } from '../dto/request/update-modifier-option.dto';
import type { UpdateOfferingDto } from '../dto/request/update-offering.dto';
import type { UpdateVariantDto } from '../dto/request/update-variant.dto';
import type { UpdateVariantOptionDto } from '../dto/request/update-variant-option.dto';
import type { CatalogChannelResponseDto } from '../dto/response/catalog-channel-response.dto';
import type { CatalogResponseDto } from '../dto/response/catalog-response.dto';
import type { CatalogTableResponseDto } from '../dto/response/catalog-table-response.dto';
import type { ModifierGroupResponseDto, ModifierOptionResponseDto } from '../dto/response/modifier-group-response.dto';
import type {
  OfferingDetailResponseDto,
  OfferingVariantResponseDto,
} from '../dto/response/offering-detail-response.dto';
import type { OfferingModifierGroupResponseDto } from '../dto/response/offering-modifier-group-response.dto';
import type { OfferingResponseDto } from '../dto/response/offering-response.dto';
import type { OfferingsTableResponseDto } from '../dto/response/offerings-table-response.dto';
import type { VariantOptionResponseDto } from '../dto/response/variant-option-response.dto';

@Injectable()
export class CatalogsGatewayService {
  private readonly logger = new Logger(CatalogsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly businessUnitService: BusinessUnitService,
  ) {}

  // Returns paginated, filtered, and sorted catalogs for the data table
  async findForTable(userId: string): Promise<CatalogTableResponseDto> {
    this.logger.log('catalogs.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-catalogs');

    const { result, count } = await this.nats.send<{ result: CatalogResponseDto[]; count: number }>(
      'commerce',
      'catalogs.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new catalog, snapshotting the active BU's currency
  async create(dto: CreateCatalogDto, buId: string): Promise<CreateResponseDto<CatalogResponseDto>> {
    const bu = await this.businessUnitService.findById(buId);
    this.logger.log(`catalogs.create — name: ${dto.name}, currency: ${bu.currencyCode}`);
    return this.nats.send('commerce', 'catalogs.create', { ...dto, currencyCode: bu.currencyCode });
  }

  // Finds a catalog by ID
  findById(id: string): Promise<CatalogResponseDto> {
    this.logger.log(`catalogs.findById — id: ${id}`);
    return this.nats.send('commerce', 'catalogs.findById', { id });
  }

  // Updates a catalog by ID
  update(id: string, dto: UpdateCatalogDto): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.update — id: ${id}`);
    return this.nats.send('commerce', 'catalogs.update', { id, ...dto });
  }

  // Deletes a catalog by ID
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.delete — id: ${id}`);
    return this.nats.send('commerce', 'catalogs.delete', { id });
  }

  // Clones a catalog into a new catalog with no channel assignments
  clone(sourceCatalogId: string): Promise<CreateResponseDto<CatalogResponseDto>> {
    this.logger.log(`catalogs.clone — sourceCatalogId: ${sourceCatalogId}`);
    return this.nats.send('commerce', 'catalogs.clone', { sourceCatalogId });
  }

  // Lists a catalog's channel assignments
  listChannels(catalogId: string): Promise<CatalogChannelResponseDto[]> {
    this.logger.log(`catalogs.channels.list — catalogId: ${catalogId}`);
    return this.nats.send('commerce', 'catalogs.channels.list', { catalogId });
  }

  // Assigns a (business unit, channel) pair to a catalog
  assignChannel(catalogId: string, dto: AssignCatalogChannelDto): Promise<CatalogChannelResponseDto> {
    this.logger.log(`catalogs.channels.assign — catalogId: ${catalogId}, channelId: ${dto.channelId}`);
    return this.nats.send('commerce', 'catalogs.channels.assign', { catalogId, ...dto });
  }

  // Removes a catalog-channel assignment
  unassignChannel(assignmentId: string): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.channels.unassign — id: ${assignmentId}`);
    return this.nats.send('commerce', 'catalogs.channels.unassign', { id: assignmentId });
  }

  // Returns paginated offerings for a catalog data table
  async findOfferingsForTable(catalogId: string, userId: string): Promise<OfferingsTableResponseDto> {
    this.logger.log(`catalogs.offerings.table — catalogId: ${catalogId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-offerings');

    const { result, count } = await this.nats.send<{ result: OfferingResponseDto[]; count: number }>(
      'commerce',
      'catalogs.offerings.table',
      { catalogId, state },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new offering under a catalog
  createOffering(catalogId: string, dto: CreateOfferingDto): Promise<CreateResponseDto<OfferingResponseDto>> {
    this.logger.log(`catalogs.offerings.create — catalogId: ${catalogId}, name: ${dto.name}`);
    return this.nats.send('commerce', 'catalogs.offerings.create', { ...dto, catalogId });
  }

  // Finds an offering by ID with full details
  findOfferingById(offeringId: string): Promise<OfferingDetailResponseDto> {
    this.logger.log(`catalogs.offerings.findById — offeringId: ${offeringId}`);
    return this.nats.send('commerce', 'catalogs.offerings.findById', { offeringId });
  }

  // Updates an offering by ID
  updateOffering(offeringId: string, dto: UpdateOfferingDto): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.offerings.update — offeringId: ${offeringId}`);
    return this.nats.send('commerce', 'catalogs.offerings.update', { offeringId, ...dto });
  }

  // Deletes an offering by ID
  deleteOffering(offeringId: string): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.offerings.delete — offeringId: ${offeringId}`);
    return this.nats.send('commerce', 'catalogs.offerings.delete', { offeringId });
  }

  // Creates a single variant from an explicit option-value combination
  createOfferingVariant(offeringId: string, dto: CreateVariantDto): Promise<OfferingVariantResponseDto> {
    this.logger.log(`catalogs.offerings.variants.create — offeringId: ${offeringId}`);
    return this.nats.send('commerce', 'catalogs.offerings.variants.create', { offeringId, ...dto });
  }

  // Lists all variants for an offering
  listOfferingVariants(offeringId: string): Promise<OfferingVariantResponseDto[]> {
    this.logger.log(`catalogs.offerings.variants.list — offeringId: ${offeringId}`);
    return this.nats.send('commerce', 'catalogs.offerings.variants.list', { offeringId });
  }

  // Updates a specific variant
  updateOfferingVariant(variantId: string, dto: UpdateVariantDto): Promise<OfferingVariantResponseDto> {
    this.logger.log(`catalogs.offerings.variants.update — variantId: ${variantId}`);
    return this.nats.send('commerce', 'catalogs.offerings.variants.update', { variantId, ...dto });
  }

  // Deletes a specific variant by ID
  deleteOfferingVariant(variantId: string): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.offerings.variants.delete — variantId: ${variantId}`);
    return this.nats.send('commerce', 'catalogs.offerings.variants.delete', { variantId });
  }

  // Lists modifier groups assigned to an offering
  listOfferingModifiers(offeringId: string): Promise<OfferingModifierGroupResponseDto[]> {
    this.logger.log(`catalogs.offerings.modifiers.list — offeringId: ${offeringId}`);
    return this.nats.send('commerce', 'catalogs.offerings.modifiers.list', { offeringId });
  }

  // Saves modifier group assignments for an offering (replaces existing)
  saveOfferingModifiers(
    offeringId: string,
    dto: SaveOfferingModifiersDto,
  ): Promise<OfferingModifierGroupResponseDto[]> {
    this.logger.log(`catalogs.offerings.modifiers.save — offeringId: ${offeringId}`);
    return this.nats.send('commerce', 'catalogs.offerings.modifiers.save', {
      itemId: offeringId,
      groupIds: dto.groupIds,
    });
  }

  // Lists variant options with their values for a catalog
  listVariantOptions(catalogId: string): Promise<VariantOptionResponseDto[]> {
    this.logger.log(`catalogs.variant-options.list — catalogId: ${catalogId}`);
    return this.nats.send('commerce', 'catalogs.variant-options.list', { catalogId });
  }

  // Returns variant option select results scoped to a catalog
  selectVariantOptions(catalogId: string, query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`catalogs.variant-options.select — catalogId: ${catalogId}`);
    return this.nats.send('commerce', 'catalogs.variant-options.select', { catalogId, ...query });
  }

  // Creates a variant option with values for a catalog
  createVariantOption(catalogId: string, dto: CreateVariantOptionDto): Promise<VariantOptionResponseDto> {
    this.logger.log(`catalogs.variant-options.create — catalogId: ${catalogId}, name: ${dto.name}`);
    return this.nats.send('commerce', 'catalogs.variant-options.create', { catalogId, ...dto });
  }

  // Updates a variant option's name and/or reconciles its values
  updateVariantOption(optionId: string, dto: UpdateVariantOptionDto): Promise<VariantOptionResponseDto> {
    this.logger.log(`catalogs.variant-options.update — optionId: ${optionId}`);
    return this.nats.send('commerce', 'catalogs.variant-options.update', { optionId, ...dto });
  }

  // Deletes a variant option and its values
  deleteVariantOption(optionId: string): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.variant-options.delete — optionId: ${optionId}`);
    return this.nats.send('commerce', 'catalogs.variant-options.delete', { optionId });
  }

  // Lists modifier groups for a catalog
  listModifierGroups(catalogId: string): Promise<ModifierGroupResponseDto[]> {
    this.logger.log(`catalogs.modifiers.list — catalogId: ${catalogId}`);
    return this.nats.send('commerce', 'catalogs.modifiers.list', { catalogId });
  }

  // Returns modifier group select results scoped to a catalog
  selectModifierGroups(catalogId: string, query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`catalogs.modifiers.select — catalogId: ${catalogId}`);
    return this.nats.send('commerce', 'catalogs.modifiers.select', { catalogId, ...query });
  }

  // Returns a single modifier group with its options
  getModifierGroup(groupId: string): Promise<ModifierGroupResponseDto> {
    this.logger.log(`catalogs.modifiers.get — groupId: ${groupId}`);
    return this.nats.send('commerce', 'catalogs.modifiers.get', { groupId });
  }

  // Creates a new modifier group under a catalog
  createModifierGroup(catalogId: string, dto: CreateModifierGroupDto): Promise<ModifierGroupResponseDto> {
    this.logger.log(`catalogs.modifiers.create — catalogId: ${catalogId}, name: ${dto.name}`);
    return this.nats.send('commerce', 'catalogs.modifiers.create', { ...dto, catalogId });
  }

  // Updates a modifier group by ID
  updateModifierGroup(groupId: string, dto: UpdateModifierGroupDto): Promise<ModifierGroupResponseDto> {
    this.logger.log(`catalogs.modifiers.update — groupId: ${groupId}`);
    return this.nats.send('commerce', 'catalogs.modifiers.update', { groupId, ...dto });
  }

  // Deletes a modifier group by ID
  deleteModifierGroup(groupId: string): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.modifiers.delete — groupId: ${groupId}`);
    return this.nats.send('commerce', 'catalogs.modifiers.delete', { groupId });
  }

  // Creates a new option in a modifier group
  createModifierOption(groupId: string, dto: CreateModifierOptionDto): Promise<ModifierOptionResponseDto> {
    this.logger.log(`catalogs.modifiers.options.create — groupId: ${groupId}`);
    return this.nats.send('commerce', 'catalogs.modifiers.options.create', { groupId, ...dto });
  }

  // Updates an option in a modifier group
  updateModifierOption(optionId: string, dto: UpdateModifierOptionDto): Promise<ModifierOptionResponseDto> {
    this.logger.log(`catalogs.modifiers.options.update — optionId: ${optionId}`);
    return this.nats.send('commerce', 'catalogs.modifiers.options.update', { optionId, ...dto });
  }

  // Deletes an option from a modifier group
  deleteModifierOption(optionId: string): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.modifiers.options.delete — optionId: ${optionId}`);
    return this.nats.send('commerce', 'catalogs.modifiers.options.delete', { optionId });
  }
}
