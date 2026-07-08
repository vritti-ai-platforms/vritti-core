import type { VariantOptionDto } from '@domain/variant-options/dto/entity/variant-option.dto';
import { VariantOptionsService } from '@domain/variant-options/services/variant-options.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SelectOptionsQueryDto, SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk/database';
import type { CreateVariantOptionDto } from '../dto/request/create-variant-option.dto';
import type { UpdateVariantOptionDto } from '../dto/request/update-variant-option.dto';

@Controller()
export class VariantOptionsController {
  private readonly logger = new Logger(VariantOptionsController.name);

  constructor(private readonly variantOptionsService: VariantOptionsService) {}

  // Lists variant options with their values for a catalog
  @MessagePattern({ cmd: 'catalogs.variant-options.list' })
  async variantOptionsList(@Payload() data: { catalogId: string }): Promise<VariantOptionDto[]> {
    this.logger.log(`catalogs.variant-options.list — catalogId: ${data.catalogId}`);
    return this.variantOptionsService.list(data.catalogId);
  }

  // Returns variant option select results scoped to a catalog
  @MessagePattern({ cmd: 'catalogs.variant-options.select' })
  async variantOptionsSelect(
    @Payload() data: { catalogId: string } & SelectOptionsQueryDto,
  ): Promise<SelectQueryResult> {
    const { catalogId, ...query } = data;
    this.logger.log(`catalogs.variant-options.select — catalogId: ${catalogId}`);
    return this.variantOptionsService.findForSelect(catalogId, query);
  }

  // Creates a variant option with values for a catalog
  @MessagePattern({ cmd: 'catalogs.variant-options.create' })
  async variantOptionsCreate(@Payload() dto: CreateVariantOptionDto): Promise<VariantOptionDto> {
    this.logger.log(`catalogs.variant-options.create — catalogId: ${dto.catalogId}, name: ${dto.name}`);
    return this.variantOptionsService.create(dto);
  }

  // Updates a variant option's name and/or reconciles its values
  @MessagePattern({ cmd: 'catalogs.variant-options.update' })
  async variantOptionsUpdate(@Payload() dto: UpdateVariantOptionDto): Promise<VariantOptionDto> {
    this.logger.log(`catalogs.variant-options.update — optionId: ${dto.optionId}`);
    return this.variantOptionsService.update(dto);
  }

  // Deletes a variant option and its values
  @MessagePattern({ cmd: 'catalogs.variant-options.delete' })
  async variantOptionsDelete(@Payload() data: { optionId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.variant-options.delete — optionId: ${data.optionId}`);
    return this.variantOptionsService.delete(data.optionId);
  }
}
