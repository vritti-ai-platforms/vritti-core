import type { TaxClassGroupDto } from '@domain/tax-groups/dto/entity/tax-class-group.dto';
import { CreateTaxClassGroupDto } from '@domain/tax-groups/dto/request/create-tax-class-group.dto';
import { UpdateTaxClassGroupDto } from '@domain/tax-groups/dto/request/update-tax-class-group.dto';
import { TaxClassGroupsDomainService } from '@domain/tax-groups/services/tax-class-groups.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class TaxGroupsClassesController {
  private readonly logger = new Logger(TaxGroupsClassesController.name);

  constructor(private readonly service: TaxClassGroupsDomainService) {}

  // Returns a group's paginated class mappings for the data table
  @MessagePattern({ cmd: 'org.taxGroups.classes.table' })
  async table(
    @Payload() data: { taxGroupId: string } & TableState,
  ): Promise<{ result: TaxClassGroupDto[]; count: number }> {
    this.logger.log(`taxGroups.classes.table — taxGroupId: ${data.taxGroupId}`);
    return this.service.findForTable(data.taxGroupId, data);
  }

  // Maps a tax class to a group in the group's country
  @MessagePattern({ cmd: 'org.taxGroups.classes.create' })
  async create(@Payload() dto: CreateTaxClassGroupDto): Promise<CreateResponseDto<TaxClassGroupDto>> {
    this.logger.log(`taxGroups.classes.create — taxGroupId: ${dto.taxGroupId}, taxClassId: ${dto.taxClassId}`);
    return this.service.create(dto);
  }

  // Updates a class mapping of a group
  @MessagePattern({ cmd: 'org.taxGroups.classes.update' })
  async update(@Payload() dto: UpdateTaxClassGroupDto): Promise<SuccessResponseDto> {
    this.logger.log(`taxGroups.classes.update — taxGroupId: ${dto.taxGroupId}, id: ${dto.id}`);
    return this.service.update(dto);
  }

  // Removes a class mapping from a group
  @MessagePattern({ cmd: 'org.taxGroups.classes.delete' })
  async delete(@Payload() data: { taxGroupId: string; id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`taxGroups.classes.delete — taxGroupId: ${data.taxGroupId}, id: ${data.id}`);
    return this.service.delete(data.taxGroupId, data.id);
  }
}
