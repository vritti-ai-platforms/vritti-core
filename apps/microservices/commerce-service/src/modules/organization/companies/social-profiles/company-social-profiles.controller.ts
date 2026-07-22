import type { PartySocialProfileDto } from '@domain/party-social-profiles/dto/entity/party-social-profile.dto';
import { CreateCompanySocialProfileDto } from '@domain/party-social-profiles/dto/request/create-company-social-profile.dto';
import { UpdateSocialProfileDto } from '@domain/party-social-profiles/dto/request/update-social-profile.dto';
import { PartySocialProfilesDomainService } from '@domain/party-social-profiles/services/party-social-profiles.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class CompanySocialProfilesController {
  private readonly logger = new Logger(CompanySocialProfilesController.name);

  constructor(private readonly service: PartySocialProfilesDomainService) {}

  // Returns the paginated social profiles of a company
  @MessagePattern({ cmd: 'org.companies.socialProfiles.table' })
  table(
    @Payload() data: { companyId: string } & TableViewState,
  ): Promise<{ result: PartySocialProfileDto[]; count: number }> {
    const { companyId, ...state } = data;
    this.logger.log(`companies.socialProfiles.table — companyId: ${companyId}`);
    return this.service.findForTable(companyId, state);
  }

  // Creates a social profile for a company
  @MessagePattern({ cmd: 'org.companies.socialProfiles.create' })
  create(@Payload() dto: CreateCompanySocialProfileDto): Promise<CreateResponseDto<PartySocialProfileDto>> {
    const { companyId, ...payload } = dto;
    this.logger.log(`companies.socialProfiles.create — companyId: ${companyId}`);
    return this.service.create(companyId, payload);
  }

  // Updates a social profile by ID
  @MessagePattern({ cmd: 'org.companies.socialProfiles.update' })
  update(@Payload() dto: UpdateSocialProfileDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`companies.socialProfiles.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  // Deletes a social profile by ID
  @MessagePattern({ cmd: 'org.companies.socialProfiles.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`companies.socialProfiles.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
