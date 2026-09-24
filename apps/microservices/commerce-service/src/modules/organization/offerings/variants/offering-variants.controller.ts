import type { OfferingVariantDto } from '@domain/offering-variants/dto/entity/offering-variant.dto';
import type { VariantCombinationsDto } from '@domain/offering-variants/dto/entity/variant-combination.dto';
import { AddBomLineDto, UpdateBomLineDto } from '@domain/offering-variants/dto/request/bom-line.dto';
import { BulkSetVariantsStatusDto } from '@domain/offering-variants/dto/request/bulk-set-variants-status.dto';
import { CreateVariantDto } from '@domain/offering-variants/dto/request/create-variant.dto';
import { GenerateVariantsDto } from '@domain/offering-variants/dto/request/generate-variants.dto';
import type { PreviewCombinationsDto } from '@domain/offering-variants/dto/request/preview-combinations.dto';
import { SetVariantFulfilmentDto } from '@domain/offering-variants/dto/request/set-variant-fulfilment.dto';
import { SetVariantTaxClassDto } from '@domain/offering-variants/dto/request/set-variant-tax-class.dto';
import { UpdateVariantDto } from '@domain/offering-variants/dto/request/update-variant.dto';
import { OfferingVariantsDomainService } from '@domain/offering-variants/services/offering-variants.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { CreateVariantInventoryItemDto } from './dto/request/create-variant-inventory-item.dto';
import { OrgOfferingVariantsService } from './services/offering-variants.service';

@Controller()
export class OrgOfferingVariantsController {
  private readonly logger = new Logger(OrgOfferingVariantsController.name);

  constructor(
    private readonly service: OfferingVariantsDomainService,
    private readonly orgService: OrgOfferingVariantsService,
  ) {}

  // Creates the inventory item this variant resolves to and links it as the variant's component
  @MessagePattern({ cmd: 'org.offerings.variants.createInventoryItem' })
  createInventoryItem(@Payload() dto: CreateVariantInventoryItemDto): Promise<CreateResponseDto<OfferingVariantDto>> {
    this.logger.log(`offerings.variants.createInventoryItem — variantId: ${dto.variantId}`);
    return this.orgService.createInventoryItem(dto);
  }

  // Returns paginated variants of one offering for the data table
  @MessagePattern({ cmd: 'org.offerings.variants.table' })
  findForTable(
    @Payload() data: { offeringId: string } & TableViewState,
  ): Promise<{ result: OfferingVariantDto[]; count: number }> {
    const { offeringId, ...state } = data;
    this.logger.log(`offerings.variants.table — offeringId: ${offeringId}`);
    return this.service.findForTable(offeringId, state as TableViewState);
  }

  // Every combination the selected values produce, flagged with the ones that already exist
  @MessagePattern({ cmd: 'org.offerings.variants.combinations' })
  previewCombinations(@Payload() dto: PreviewCombinationsDto): Promise<VariantCombinationsDto> {
    this.logger.log(`offerings.variants.combinations — offeringId: ${dto.offeringId}`);
    return this.service.previewCombinations(dto);
  }

  // Returns one variant
  @MessagePattern({ cmd: 'org.offerings.variants.findById' })
  findById(@Payload() data: { id: string }): Promise<OfferingVariantDto> {
    this.logger.log(`offerings.variants.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Creates every selected combination that does not exist yet. Additive: an unselected combination
  // is never deleted, because a variant may already carry stock or sit on an order line.
  @MessagePattern({ cmd: 'org.offerings.variants.generate' })
  generate(@Payload() dto: GenerateVariantsDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.generate — offeringId: ${dto.offeringId}, count: ${dto.combinations.length}`);
    return this.service.generate(dto);
  }

  // Creates a single variant from one explicit combination
  @MessagePattern({ cmd: 'org.offerings.variants.create' })
  create(@Payload() dto: CreateVariantDto): Promise<CreateResponseDto<OfferingVariantDto>> {
    this.logger.log(`offerings.variants.create — offeringId: ${dto.offeringId}`);
    return this.service.create(dto);
  }

  // Updates a variant; activating one is refused until its bill of materials satisfies the offering type
  @MessagePattern({ cmd: 'org.offerings.variants.update' })
  update(@Payload() dto: UpdateVariantDto): Promise<SuccessResponseDto> {
    const { id, ...data } = dto;
    this.logger.log(`offerings.variants.update — id: ${id}`);
    return this.service.update(id, data);
  }

  // Switches many variants at once; refused outright unless every one of them satisfies the BOM rule
  @MessagePattern({ cmd: 'org.offerings.variants.bulkSetStatus' })
  bulkSetStatus(@Payload() dto: BulkSetVariantsStatusDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bulkSetStatus — count: ${dto.ids.length}, isActive: ${dto.isActive}`);
    return this.service.bulkSetStatus(dto);
  }

  // One component at a time, so concurrent edits to the same variant cannot clobber each other
  @MessagePattern({ cmd: 'org.offerings.variants.bom.lines.add' })
  addBomLine(@Payload() dto: AddBomLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.lines.add — variantId: ${dto.variantId}`);
    return this.service.addBomLine(dto);
  }

  @MessagePattern({ cmd: 'org.offerings.variants.bom.lines.update' })
  updateBomLine(@Payload() dto: UpdateBomLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.lines.update — id: ${dto.id}`);
    return this.service.updateBomLine(dto);
  }

  @MessagePattern({ cmd: 'org.offerings.variants.bom.lines.delete' })
  deleteBomLine(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.lines.delete — id: ${data.id}`);
    return this.service.deleteBomLine(data.id);
  }

  // Links the item already carrying this variant's SKU, without the caller naming it
  @MessagePattern({ cmd: 'org.offerings.variants.bom.addSuggested' })
  addSuggestedComponent(@Payload() data: { variantId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.addSuggested — variantId: ${data.variantId}`);
    return this.service.addSuggestedComponent(data.variantId);
  }

  // Pins this variant's own tax class, exempting it from the offering's cascade
  @MessagePattern({ cmd: 'org.offerings.variants.setTaxClass' })
  setTaxClass(@Payload() dto: SetVariantTaxClassDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.setTaxClass — id: ${dto.id}`);
    return this.service.setTaxClass(dto.id, dto);
  }

  // Pins this variant's own fulfilment type, exempting it from the offering's cascade
  @MessagePattern({ cmd: 'org.offerings.variants.setFulfilment' })
  setFulfilment(@Payload() dto: SetVariantFulfilmentDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.setFulfilment — id: ${dto.id}, type: ${dto.fulfilmentType}`);
    return this.service.setFulfilment(dto.id, dto);
  }

  // Drops the fulfilment override and resynchronises with the parent offering
  @MessagePattern({ cmd: 'org.offerings.variants.clearFulfilment' })
  clearFulfilment(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.clearFulfilment — id: ${data.id}`);
    return this.service.clearFulfilmentOverride(data.id);
  }

  // Drops the override and resynchronises with the parent offering
  @MessagePattern({ cmd: 'org.offerings.variants.clearTaxClass' })
  clearTaxClass(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.clearTaxClass — id: ${data.id}`);
    return this.service.clearTaxClassOverride(data.id);
  }

  // Deletes a variant
  @MessagePattern({ cmd: 'org.offerings.variants.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
