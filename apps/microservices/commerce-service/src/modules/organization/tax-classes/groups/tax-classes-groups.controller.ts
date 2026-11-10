import type { TaxClassGroupDto } from '@domain/tax-groups/dto/entity/tax-class-group.dto';
import { CreateTaxClassGroupDto } from '@domain/tax-groups/dto/request/create-tax-class-group.dto';
import { UpdateTaxClassGroupOnClassDto } from '@domain/tax-groups/dto/request/update-tax-class-group-on-class.dto';
import { TaxClassGroupsDomainService } from '@domain/tax-groups/services/tax-class-groups.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class TaxClassesGroupsController {
  private readonly logger = new Logger(TaxClassesGroupsController.name);

  constructor(private readonly service: TaxClassGroupsDomainService) {}

  // Returns a class's paginated group mappings in the table's context country
  @MessagePattern({ cmd: 'org.taxClasses.groups.table' })
  async table(
    @Payload() data: { taxClassId: string } & TableState,
  ): Promise<{ result: TaxClassGroupDto[]; count: number }> {
    this.logger.log(`taxClasses.groups.table — taxClassId: ${data.taxClassId}`);
    return this.service.findForClassTable(data.taxClassId, data);
  }

  // Maps a class to a tax group in the group's country
  @MessagePattern({ cmd: 'org.taxClasses.groups.create' })
  async create(@Payload() dto: CreateTaxClassGroupDto): Promise<CreateResponseDto<TaxClassGroupDto>> {
    this.logger.log(`taxClasses.groups.create — taxClassId: ${dto.taxClassId}, taxGroupId: ${dto.taxGroupId}`);
    return this.service.create(dto);
  }

  // Updates a group mapping of a class
  @MessagePattern({ cmd: 'org.taxClasses.groups.update' })
  async update(@Payload() dto: UpdateTaxClassGroupOnClassDto): Promise<SuccessResponseDto> {
    this.logger.log(`taxClasses.groups.update — taxClassId: ${dto.taxClassId}, id: ${dto.id}`);
    return this.service.updateOnClass(dto);
  }

  // Removes a group mapping of a class
  @MessagePattern({ cmd: 'org.taxClasses.groups.delete' })
  async delete(@Payload() data: { taxClassId: string; id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`taxClasses.groups.delete — taxClassId: ${data.taxClassId}, id: ${data.id}`);
    return this.service.deleteOnClass(data.taxClassId, data.id);
  }
}
