import type { PersonResponseDto } from '@commerce/parties/dto/response/person-response.dto';
import type { PartyCommunicationResponseDto } from '@commerce/party-communications/dto/response/party-communication-response.dto';
import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequireApp } from '@vritti/api-sdk/auth';
import type { CreateResponseDto } from '@vritti/api-sdk/database';
import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AddPersonCommunicationAppDto } from './dto/request/add-person-communication-app.dto';
import { CreatePersonAppDto } from './dto/request/create-person-app.dto';
import { FindPeopleByCommunicationQueryDto } from './dto/request/find-people-by-communication.dto';
import { PeopleGatewayService } from './services/people-gateway.service';

/**
 * People operations for an organization's REST app credentials.
 *
 * The REST counterpart of `people.app.resolver.ts`, serving the same three
 * primitives to a client that speaks HTTP rather than GraphQL. Both sit beside
 * `people-gateway.controller.ts`, which serves staff over a session — the split is
 * the caller, not the data.
 *
 * Its own `app/` segment because the staff controller already owns
 * `@Controller('people')` under the same `commerce-api` prefix; sharing it would
 * collide on `POST /people`.
 *
 * `@RequireApp(HTTP)` is the whole authentication story, and it is enforcing rather
 * than descriptive: a `GRAPHQL` credential presented here is refused, just as an
 * `HTTP` one is refused at `/graphql`. Nothing else is needed at the class level —
 * no `@Public()`, no `@SkipCsrf()`, no `@UseGuards()`.
 *
 * Gated like every other app surface: `@RequireFeature` plus a `@RequirePermission` per operation,
 * resolved against the credential's `app` bucket. So a storefront that may register shoppers is a
 * credential that was granted exactly that and nothing else — signing a valid request is not itself
 * permission to write people.
 *
 * The consequence to hold in mind: an ungranted or revoked credential cannot sign anyone up. That is
 * the point, but it does mean the grant is part of provisioning a storefront, not an afterthought.
 */
@ApiTags('Commerce - People (App)')
@RequireApp(AppTypeValues.HTTP)
@RequireFeature(ORG_PEOPLE.featureCode)
@Controller('app/people')
export class PeopleAppController {
  private readonly logger = new Logger(PeopleAppController.name);

  constructor(private readonly service: PeopleGatewayService) {}

  /**
   * Resolves who is reachable at an email or phone, oldest party first.
   *
   * A list because one address legitimately sits on several people — the table's
   * unique is per party. Which one wins is the caller's policy.
   *
   * The filters travel as query parameters, and the request signature covers the raw
   * query string, so altering them in transit invalidates it.
   */
  @Get('by-communication')
  @RequirePermission(ORG_PEOPLE.communications.view)
  findByCommunication(@Query() query: FindPeopleByCommunicationQueryDto): Promise<string[]> {
    this.logger.log('GET /commerce-api/app/people/by-communication');
    return this.service.findPartiesByCommunication(query.channel, query.value);
  }

  /** Creates the person plus their primary EMAIL and PHONE rows, in one transaction. */
  @Post()
  @RequirePermission(ORG_PEOPLE.add)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePersonAppDto): Promise<CreateResponseDto<PersonResponseDto>> {
    this.logger.log('POST /commerce-api/app/people');
    return this.service.create({ ...dto, isActive: true });
  }

  /** Adds a communication — the `WEB_APP` reference in the registration flow. */
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
