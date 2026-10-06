import type { PersonResponseDto } from '@commerce/parties/dto/response/person-response.dto';
import type { PartyCommunicationResponseDto } from '@commerce/party-communications/dto/response/party-communication-response.dto';
import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';
import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AddPersonCommunicationAppDto } from './dto/request/add-person-communication-app.dto';
import { CreatePersonAppDto } from './dto/request/create-person-app.dto';
import { FindPeopleByCommunicationQueryDto } from './dto/request/find-people-by-communication.dto';
import { PeopleGatewayService } from './services/people-gateway.service';

@ApiTags('Commerce - People (App)')
@Require(AuthType.App, AppTypeValues.HTTP)
@RequireFeature(ORG_PEOPLE.featureCode)
@Controller('app/people')
export class PeopleAppController {
  private readonly logger = new Logger(PeopleAppController.name);

  constructor(private readonly service: PeopleGatewayService) {}

  // Resolves who is reachable at an email or phone, oldest party first
  @Get('by-communication')
  @RequirePermission(ORG_PEOPLE.communications.view)
  findByCommunication(@Query() query: FindPeopleByCommunicationQueryDto): Promise<PersonResponseDto[]> {
    this.logger.log('GET /commerce-api/app/people/by-communication');
    return this.service.findPeopleByCommunication(query.channel, query.value);
  }

  // Creates the person plus their primary EMAIL and PHONE rows, in one transaction
  @Post()
  @RequirePermission(ORG_PEOPLE.add)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePersonAppDto): Promise<CreateResponseDto<PersonResponseDto>> {
    this.logger.log('POST /commerce-api/app/people');
    return this.service.create({ ...dto, isActive: true });
  }

  // Adds a communication — the `WEB_APP` reference in the registration flow
  @Post(':id/communications')
  @RequirePermission(ORG_PEOPLE.communications.add)
  @HttpCode(HttpStatus.CREATED)
  addCommunication(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddPersonCommunicationAppDto,
  ): Promise<CreateResponseDto<PartyCommunicationResponseDto>> {
    this.logger.log(`POST /commerce-api/app/people/${id}/communications`);
    return this.service.createCommunication(id, dto);
  }
}
