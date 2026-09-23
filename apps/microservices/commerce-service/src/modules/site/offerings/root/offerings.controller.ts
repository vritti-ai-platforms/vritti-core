import type { OfferingDto } from '@domain/offerings/dto/entity/offering.dto';
import { BulkSetOfferingStatusDto } from '@domain/offerings/dto/request/bulk-set-offering-status.dto';
import { CreateOfferingDto } from '@domain/offerings/dto/request/create-offering.dto';
import { SetOfferingStatusDto } from '@domain/offerings/dto/request/set-offering-status.dto';
import { SetOfferingTaxClassDto } from '@domain/offerings/dto/request/set-offering-tax-class.dto';
import { UpdateOfferingDto } from '@domain/offerings/dto/request/update-offering.dto';
import { OfferingsDomainService } from '@domain/offerings/services/offerings.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class SiteOfferingsController {
  private readonly logger = new Logger(SiteOfferingsController.name);

  constructor(private readonly service: OfferingsDomainService) {}

  // Returns paginated offerings for the data table
  @MessagePattern({ cmd: 'site.offerings.table' })
  findForTable(@Payload() state: TableViewState): Promise<{ result: OfferingDto[]; count: number }> {
    this.logger.log('offerings.table');
    return this.service.findForTable(state);
  }

  // Returns one offering with its dimension and variant counts
  @MessagePattern({ cmd: 'site.offerings.findById' })
  findById(@Payload() data: { id: string }): Promise<OfferingDto> {
    this.logger.log(`offerings.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Creates a site-owned offering; dimensions and variants follow
  @MessagePattern({ cmd: 'site.offerings.create' })
  create(@Payload() dto: CreateOfferingDto): Promise<CreateResponseDto<OfferingDto>> {
    this.logger.log(`offerings.create — code: ${dto.code}`);
    return this.service.create(dto);
  }

  // Updates an offering this site owns
  @MessagePattern({ cmd: 'site.offerings.update' })
  update(@Payload() dto: UpdateOfferingDto): Promise<SuccessResponseDto> {
    const { id, ...data } = dto;
    this.logger.log(`offerings.update — id: ${id}`);
    return this.service.update(id, data);
  }

  // Sets the tax class and cascades it to every variant that has not been overridden
  @MessagePattern({ cmd: 'site.offerings.setTaxClass' })
  setTaxClass(@Payload() dto: SetOfferingTaxClassDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.setTaxClass — id: ${dto.id}`);
    return this.service.setTaxClass(dto.id, dto);
  }

  // Switches an offering on or off; refused while it has no variants
  @MessagePattern({ cmd: 'site.offerings.setStatus' })
  setStatus(@Payload() dto: SetOfferingStatusDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.setStatus — id: ${dto.id}, isActive: ${dto.isActive}`);
    return this.service.setStatus(dto.id, dto);
  }

  // Switches many offerings at once; refused outright unless every one of them may make the move
  @MessagePattern({ cmd: 'site.offerings.bulkSetStatus' })
  bulkSetStatus(@Payload() dto: BulkSetOfferingStatusDto): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.bulkSetStatus — count: ${dto.ids.length}, isActive: ${dto.isActive}`);
    return this.service.bulkSetStatus(dto);
  }

  // Deletes an offering this site owns; refused while it has variants
  @MessagePattern({ cmd: 'site.offerings.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`offerings.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
