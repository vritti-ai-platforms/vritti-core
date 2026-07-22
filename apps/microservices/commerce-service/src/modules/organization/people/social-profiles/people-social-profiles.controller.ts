import type { PartySocialProfileDto } from '@domain/party-social-profiles/dto/entity/party-social-profile.dto';
import { CreatePersonSocialProfileDto } from '@domain/party-social-profiles/dto/request/create-person-social-profile.dto';
import { UpdateSocialProfileDto } from '@domain/party-social-profiles/dto/request/update-social-profile.dto';
import { PartySocialProfilesDomainService } from '@domain/party-social-profiles/services/party-social-profiles.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class PeopleSocialProfilesController {
  private readonly logger = new Logger(PeopleSocialProfilesController.name);

  constructor(private readonly service: PartySocialProfilesDomainService) {}

  // Returns the paginated social profiles of a person
  @MessagePattern({ cmd: 'org.people.socialProfiles.table' })
  table(
    @Payload() data: { personId: string } & TableViewState,
  ): Promise<{ result: PartySocialProfileDto[]; count: number }> {
    const { personId, ...state } = data;
    this.logger.log(`people.socialProfiles.table — personId: ${personId}`);
    return this.service.findForTable(personId, state);
  }

  // Creates a social profile for a person
  @MessagePattern({ cmd: 'org.people.socialProfiles.create' })
  create(@Payload() dto: CreatePersonSocialProfileDto): Promise<CreateResponseDto<PartySocialProfileDto>> {
    const { personId, ...payload } = dto;
    this.logger.log(`people.socialProfiles.create — personId: ${personId}`);
    return this.service.create(personId, payload);
  }

  // Updates a social profile by ID
  @MessagePattern({ cmd: 'org.people.socialProfiles.update' })
  update(@Payload() dto: UpdateSocialProfileDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`people.socialProfiles.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  // Deletes a social profile by ID
  @MessagePattern({ cmd: 'org.people.socialProfiles.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`people.socialProfiles.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
