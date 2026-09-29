import type { VariantBomDto } from '@domain/offering-bom/dto/entity/variant-bom.dto';
import { AddBomLineDto, UpdateBomLineDto } from '@domain/offering-bom/dto/request/bom-line.dto';
import { OfferingBomDomainService } from '@domain/offering-bom/services/offering-bom.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class LeOfferingBomController {
  private readonly logger = new Logger(LeOfferingBomController.name);

  constructor(private readonly bom: OfferingBomDomainService) {}

  // The components, plus the inventory item already carrying this variant's SKU — read on its own
  // because only the bill-of-materials view needs either
  @MessagePattern({ cmd: 'le.offerings.variants.bom.lines.list' })
  findBom(@Payload() data: { variantId: string }): Promise<VariantBomDto> {
    this.logger.log(`offerings.variants.bom.lines.list — variantId: ${data.variantId}`);
    return this.bom.findByVariant(data.variantId);
  }

  // One component at a time, so concurrent edits to the same variant cannot clobber each other
  @MessagePattern({ cmd: 'le.offerings.variants.bom.lines.add' })
  addBomLine(@Payload() dto: AddBomLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.lines.add — variantId: ${dto.variantId}`);
    return this.bom.addLine(dto);
  }

  @MessagePattern({ cmd: 'le.offerings.variants.bom.lines.update' })
  updateBomLine(@Payload() dto: UpdateBomLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.lines.update — id: ${dto.id}`);
    return this.bom.updateLine(dto);
  }

  @MessagePattern({ cmd: 'le.offerings.variants.bom.lines.delete' })
  deleteBomLine(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.lines.delete — id: ${data.id}`);
    return this.bom.deleteLine(data.id);
  }

  // Links the item already carrying this variant's SKU, without the caller naming it
  @MessagePattern({ cmd: 'le.offerings.variants.bom.addSuggested' })
  addSuggestedComponent(@Payload() data: { variantId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.variants.bom.addSuggested — variantId: ${data.variantId}`);
    return this.bom.addSuggested(data.variantId);
  }
}
