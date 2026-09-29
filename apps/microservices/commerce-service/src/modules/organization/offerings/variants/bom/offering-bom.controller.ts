import type { VariantBomDto } from '@domain/offering-bom/dto/entity/variant-bom.dto';
import { AddBomLineDto, UpdateBomLineDto } from '@domain/offering-bom/dto/request/bom-line.dto';
import { OfferingBomDomainService } from '@domain/offering-bom/services/offering-bom.service';
import type { OfferingVariantDto } from '@domain/offering-variants/dto/entity/offering-variant.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { CreateVariantInventoryItemDto } from './dto/request/create-variant-inventory-item.dto';
import { OrgOfferingBomService } from './services/offering-bom.service';

@Controller()
export class OrgOfferingBomController {
  private readonly logger = new Logger(OrgOfferingBomController.name);

  constructor(
    private readonly bom: OfferingBomDomainService,
    private readonly orgService: OrgOfferingBomService,
  ) {}

  // Creates the inventory item this variant resolves to and links it as the variant's component
  @MessagePattern({ cmd: 'org.offerings.variants.createInventoryItem' })
  createInventoryItem(@Payload() dto: CreateVariantInventoryItemDto): Promise<CreateResponseDto<OfferingVariantDto>> {
    this.logger.log(`offerings.variants.createInventoryItem — variantId: ${dto.variantId}`);
    return this.orgService.createInventoryItem(dto);
  }

  // The components, plus the inventory item already carrying this variant's SKU — read on its own
  // because only the bill-of-materials view needs either
  @MessagePattern({ cmd: 'org.offerings.variants.bom.lines.list' })
  findBom(@Payload() data: { variantId: string }): Promise<VariantBomDto> {
    this.logger.log(`offerings.variants.bom.lines.list — variantId: ${data.variantId}`);
    return this.bom.findByVariant(data.variantId);
  }

  // One component at a time, so concurrent edits to the same variant cannot clobber each other
  @MessagePattern({ cmd: 'org.offerings.variants.bom.lines.add' })
  addBomLine(@Payload() dto: AddBomLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.lines.add — variantId: ${dto.variantId}`);
    return this.bom.addLine(dto);
  }

  @MessagePattern({ cmd: 'org.offerings.variants.bom.lines.update' })
  updateBomLine(@Payload() dto: UpdateBomLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.lines.update — id: ${dto.id}`);
    return this.bom.updateLine(dto);
  }

  @MessagePattern({ cmd: 'org.offerings.variants.bom.lines.delete' })
  deleteBomLine(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.lines.delete — id: ${data.id}`);
    return this.bom.deleteLine(data.id);
  }

  // Links the item already carrying this variant's SKU, without the caller naming it
  @MessagePattern({ cmd: 'org.offerings.variants.bom.addSuggested' })
  addSuggestedComponent(@Payload() data: { variantId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.addSuggested — variantId: ${data.variantId}`);
    return this.bom.addSuggested(data.variantId);
  }
}
