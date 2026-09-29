import { OfferingBomDomainService } from '@domain/offering-bom/services/offering-bom.service';
import type {
  OfferingVariantDto,
  OfferingVariantTableRowDto,
} from '@domain/offering-variants/dto/entity/offering-variant.dto';
import type { VariantCombinationsDto } from '@domain/offering-variants/dto/entity/variant-combination.dto';
import type { BulkClearVariantsTaxClassDto } from '@domain/offering-variants/dto/request/bulk-clear-variants-tax-class.dto';
import { BulkSetVariantsStatusDto } from '@domain/offering-variants/dto/request/bulk-set-variants-status.dto';
import type { BulkSetVariantsTaxClassDto } from '@domain/offering-variants/dto/request/bulk-set-variants-tax-class.dto';
import { CreateVariantDto } from '@domain/offering-variants/dto/request/create-variant.dto';
import { GenerateVariantsDto } from '@domain/offering-variants/dto/request/generate-variants.dto';
import type { PreviewCombinationsDto } from '@domain/offering-variants/dto/request/preview-combinations.dto';
import { SetVariantFulfilmentDto } from '@domain/offering-variants/dto/request/set-variant-fulfilment.dto';
import { SetVariantTaxClassDto } from '@domain/offering-variants/dto/request/set-variant-tax-class.dto';
import { UpdateVariantDto } from '@domain/offering-variants/dto/request/update-variant.dto';
import { OfferingVariantsDomainService } from '@domain/offering-variants/services/offering-variants.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class SiteOfferingVariantsController {
  private readonly logger = new Logger(SiteOfferingVariantsController.name);

  constructor(
    private readonly service: OfferingVariantsDomainService,
    readonly _bom: OfferingBomDomainService,
  ) {}

  // Returns paginated variants of one offering for the data table
  @MessagePattern({ cmd: 'site.offerings.variants.table' })
  findForTable(
    @Payload() data: { offeringId: string } & TableViewState,
  ): Promise<{ result: OfferingVariantTableRowDto[]; count: number }> {
    const { offeringId, ...state } = data;
    this.logger.log(`offerings.variants.table — offeringId: ${offeringId}`);
    return this.service.findForTable(offeringId, state as TableViewState);
  }

  // Every combination the selected values produce, flagged with the ones that already exist
  @MessagePattern({ cmd: 'site.offerings.variants.combinations' })
  previewCombinations(@Payload() dto: PreviewCombinationsDto): Promise<VariantCombinationsDto> {
    this.logger.log(`offerings.variants.combinations — offeringId: ${dto.offeringId}`);
    return this.service.previewCombinations(dto);
  }

  // Flat rows for the file export, scoped to one offering
  @MessagePattern({ cmd: 'site.offerings.variants.exportRows' })
  exportRows(
    @Payload() data: { offeringId: string; limit: number; offset: number },
  ): Promise<Record<string, unknown>[]> {
    this.logger.log(`offerings.variants.exportRows — offeringId: ${data.offeringId}, offset: ${data.offset}`);
    return this.service.findForExport(data.offeringId, data);
  }

  // Returns one variant
  @MessagePattern({ cmd: 'site.offerings.variants.findById' })
  findById(@Payload() data: { id: string }): Promise<OfferingVariantDto> {
    this.logger.log(`offerings.variants.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Creates every selected combination that does not exist yet. Additive: an unselected combination
  // is never deleted, because a variant may already carry stock or sit on an order line.
  @MessagePattern({ cmd: 'site.offerings.variants.generate' })
  generate(@Payload() dto: GenerateVariantsDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.generate — offeringId: ${dto.offeringId}, count: ${dto.combinations.length}`);
    return this.service.generate(dto);
  }

  // Creates a single variant from one explicit combination
  @MessagePattern({ cmd: 'site.offerings.variants.create' })
  create(@Payload() dto: CreateVariantDto): Promise<CreateResponseDto<OfferingVariantDto>> {
    this.logger.log(`offerings.variants.create — offeringId: ${dto.offeringId}`);
    return this.service.create(dto);
  }

  // Updates a variant; activating one is refused until its bill of materials satisfies the offering type
  @MessagePattern({ cmd: 'site.offerings.variants.update' })
  update(@Payload() dto: UpdateVariantDto): Promise<SuccessResponseDto> {
    const { id, ...data } = dto;
    this.logger.log(`offerings.variants.update — id: ${id}`);
    return this.service.update(id, data);
  }

  // Pins one tax class across many variants at once, each marked as overridden from here on
  @MessagePattern({ cmd: 'site.offerings.variants.bulkSetTaxClass' })
  bulkSetTaxClass(@Payload() dto: BulkSetVariantsTaxClassDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bulkSetTaxClass — count: ${dto.ids.length}, taxClassId: ${dto.taxClassId}`);
    return this.service.bulkSetTaxClass(dto);
  }

  // The batch form of clearTaxClass — every selected variant follows the offering again
  @MessagePattern({ cmd: 'site.offerings.variants.bulkClearTaxClass' })
  bulkClearTaxClass(@Payload() dto: BulkClearVariantsTaxClassDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bulkClearTaxClass — count: ${dto.ids.length}`);
    return this.service.bulkClearTaxClass(dto);
  }

  // Switches many variants at once; refused outright unless every one of them satisfies the BOM rule
  @MessagePattern({ cmd: 'site.offerings.variants.bulkSetStatus' })
  bulkSetStatus(@Payload() dto: BulkSetVariantsStatusDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bulkSetStatus — count: ${dto.ids.length}, isActive: ${dto.isActive}`);
    return this.service.bulkSetStatus(dto);
  }

  // Pins this variant's own tax class, exempting it from the offering's cascade
  @MessagePattern({ cmd: 'site.offerings.variants.setTaxClass' })
  setTaxClass(@Payload() dto: SetVariantTaxClassDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.setTaxClass — id: ${dto.id}`);
    return this.service.setTaxClass(dto.id, dto);
  }

  // Pins this variant's own fulfilment type, exempting it from the offering's cascade
  @MessagePattern({ cmd: 'site.offerings.variants.setFulfilment' })
  setFulfilment(@Payload() dto: SetVariantFulfilmentDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.setFulfilment — id: ${dto.id}, type: ${dto.fulfilmentType}`);
    return this.service.setFulfilment(dto.id, dto);
  }

  // Drops the fulfilment override and resynchronises with the parent offering
  @MessagePattern({ cmd: 'site.offerings.variants.clearFulfilment' })
  clearFulfilment(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.clearFulfilment — id: ${data.id}`);
    return this.service.clearFulfilmentOverride(data.id);
  }

  // Drops the override and resynchronises with the parent offering
  @MessagePattern({ cmd: 'site.offerings.variants.clearTaxClass' })
  clearTaxClass(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.clearTaxClass — id: ${data.id}`);
    return this.service.clearTaxClassOverride(data.id);
  }

  // Deletes a variant
  @MessagePattern({ cmd: 'site.offerings.variants.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
