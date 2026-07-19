import { CategoriesDomainService } from '@domain/categories/services/categories.service';
import type { ModifierGroupWithOptionsDto } from '@domain/modifier-groups/dto/entity/modifier-group.dto';
import { SaveItemModifiersDto } from '@domain/modifier-groups/dto/request/save-item-modifiers.dto';
import { ModifierGroupsDomainService } from '@domain/modifier-groups/services/modifier-groups.service';
import type { OfferingDto } from '@domain/offerings/dto/entity/offering.dto';
import type { OfferingDetailDto, OfferingVariantDto } from '@domain/offerings/dto/entity/offering-detail.dto';
import { CreateOfferingDto } from '@domain/offerings/dto/request/create-offering.dto';
import { CreateVariantDto } from '@domain/offerings/dto/request/create-variant.dto';
import { UpdateOfferingPayloadDto } from '@domain/offerings/dto/request/update-offering.dto';
import { UpdateVariantPayloadDto } from '@domain/offerings/dto/request/update-variant.dto';
import { OfferingsDomainService } from '@domain/offerings/services/offerings.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class OfferingsController {
  private readonly logger = new Logger(OfferingsController.name);

  constructor(
    private readonly offeringsService: OfferingsDomainService,
    private readonly modifierGroupsService: ModifierGroupsDomainService,
    private readonly categoriesService: CategoriesDomainService,
  ) {}

  // Returns paginated offerings within a catalog
  @MessagePattern({ cmd: 'site.catalogs.offerings.table' })
  async offeringsTable(
    @Payload() data: { catalogId: string; state: TableViewState },
  ): Promise<{ result: OfferingDto[]; count: number }> {
    this.logger.log(`catalogs.offerings.table — catalogId: ${data.catalogId}`);
    return this.offeringsService.findForTable(data.catalogId, data.state);
  }

  // Creates an offering within a catalog
  @MessagePattern({ cmd: 'site.catalogs.offerings.create' })
  async offeringsCreate(@Payload() dto: CreateOfferingDto): Promise<OfferingDto> {
    this.logger.log(`catalogs.offerings.create — catalogId: ${dto.catalogId}, name: ${dto.name}`);
    if (dto.categoryId) await this.categoriesService.assertIsLeaf(dto.categoryId);
    return this.offeringsService.create(dto);
  }

  // Returns an offering by ID with full details
  @MessagePattern({ cmd: 'site.catalogs.offerings.findById' })
  async offeringsFindById(@Payload() data: { offeringId: string }): Promise<OfferingDetailDto> {
    this.logger.log(`catalogs.offerings.findById — offeringId: ${data.offeringId}`);
    return this.offeringsService.findById(data.offeringId);
  }

  // Updates an offering's basic info
  @MessagePattern({ cmd: 'site.catalogs.offerings.update' })
  async offeringsUpdate(@Payload() data: UpdateOfferingPayloadDto): Promise<OfferingDto> {
    const { offeringId, ...updateData } = data;
    this.logger.log(`catalogs.offerings.update — offeringId: ${offeringId}`);
    if (updateData.categoryId) await this.categoriesService.assertIsLeaf(updateData.categoryId);
    return this.offeringsService.update(offeringId, updateData);
  }

  // Deletes an offering
  @MessagePattern({ cmd: 'site.catalogs.offerings.delete' })
  async offeringsDelete(@Payload() data: { offeringId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.offerings.delete — offeringId: ${data.offeringId}`);
    return this.offeringsService.delete(data.offeringId);
  }

  // Creates a single variant from an explicit option-value combination
  @MessagePattern({ cmd: 'site.catalogs.offerings.variants.create' })
  async offeringsVariantsCreate(@Payload() dto: CreateVariantDto): Promise<OfferingVariantDto> {
    this.logger.log(`catalogs.offerings.variants.create — offeringId: ${dto.offeringId}`);
    return this.offeringsService.createVariant(dto);
  }

  // Lists variants for an offering
  @MessagePattern({ cmd: 'site.catalogs.offerings.variants.list' })
  async offeringsVariantsList(@Payload() data: { offeringId: string }): Promise<OfferingVariantDto[]> {
    this.logger.log(`catalogs.offerings.variants.list — offeringId: ${data.offeringId}`);
    return this.offeringsService.listVariants(data.offeringId);
  }

  // Updates a single variant
  @MessagePattern({ cmd: 'site.catalogs.offerings.variants.update' })
  async offeringsVariantsUpdate(@Payload() data: UpdateVariantPayloadDto): Promise<OfferingVariantDto> {
    const { variantId, ...updateData } = data;
    this.logger.log(`catalogs.offerings.variants.update — variantId: ${variantId}`);
    return this.offeringsService.updateVariant(variantId, updateData);
  }

  // Deletes a single variant
  @MessagePattern({ cmd: 'site.catalogs.offerings.variants.delete' })
  async offeringsVariantsDelete(@Payload() data: { variantId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.offerings.variants.delete — variantId: ${data.variantId}`);
    return this.offeringsService.deleteVariant(data.variantId);
  }

  // Returns assigned modifier groups for an offering with options
  @MessagePattern({ cmd: 'site.catalogs.offerings.modifiers.list' })
  async offeringsModifiersList(@Payload() data: { offeringId: string }): Promise<ModifierGroupWithOptionsDto[]> {
    this.logger.log(`catalogs.offerings.modifiers.list — offeringId: ${data.offeringId}`);
    return this.modifierGroupsService.listItemModifiers(data.offeringId);
  }

  // Assigns modifier groups to an offering (replaces all)
  @MessagePattern({ cmd: 'site.catalogs.offerings.modifiers.save' })
  async offeringsModifiersSave(@Payload() dto: SaveItemModifiersDto): Promise<ModifierGroupWithOptionsDto[]> {
    this.logger.log(`catalogs.offerings.modifiers.save — itemId: ${dto.itemId}`);
    return this.modifierGroupsService.saveItemModifiers(dto);
  }
}
