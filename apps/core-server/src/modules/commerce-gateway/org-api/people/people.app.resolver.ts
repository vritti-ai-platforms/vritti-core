import { Logger } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RequireApp } from '@vritti/api-sdk/auth';
import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { Person } from './graphql/person.type';
import { PersonCommunication } from './graphql/person-communication.type';
import {
  AddPersonCommunicationInput,
  CreatePersonInput,
  FindPeopleByCommunicationInput,
} from './graphql/person-mutation.input';
import { PeopleGatewayService } from './services/people-gateway.service';

/**
 * People operations for the organization's own web apps.
 *
 * Sits beside `people-gateway.controller.ts`, which serves the same feature to
 * staff over REST. The split is the caller, not the data: that one is guarded by a
 * session, this one by `@RequireApp` — a signed request whose app credential
 * establishes which organization it speaks for. There is no user session here; the
 * calling app authenticated its own visitor before reaching us.
 *
 * Deliberately primitive. These are three separate operations, not a registration
 * endpoint — `@vritti/vap-sdk` composes them into the signup flow so every web app
 * shares one implementation of it. What stays atomic server-side is the part that
 * has to be: `createPerson` writes the party and its primary EMAIL and PHONE rows in
 * a single transaction.
 *
 * Gated like every other app surface: `@RequireFeature` plus a `@RequirePermission` per operation,
 * resolved against the credential's `app` bucket. So a storefront that may register shoppers is a
 * credential that was granted exactly that and nothing else — signing a valid request is not itself
 * permission to write people.
 *
 * The consequence to hold in mind: an ungranted or revoked credential cannot sign anyone up. That is
 * the point, but it does mean the grant is part of provisioning a storefront, not an afterthought.
 */
@Resolver()
@RequireApp(AppTypeValues.GRAPHQL)
@RequireFeature(ORG_PEOPLE.featureCode)
export class PeopleAppResolver {
  private readonly logger = new Logger(PeopleAppResolver.name);

  constructor(private readonly peopleGatewayService: PeopleGatewayService) {}

  /**
   * Who is reachable at this email or phone, oldest party first.
   *
   * Returns a list because one address legitimately sits on several people — the
   * table's unique is per party. Choosing between them is the caller's policy.
   */
  @Query(() => [ID], { name: 'peopleByCommunication' })
  @RequirePermission(ORG_PEOPLE.communications.view)
  async peopleByCommunication(@Args('input') input: FindPeopleByCommunicationInput): Promise<string[]> {
    this.logger.log('QUERY peopleByCommunication');
    return this.peopleGatewayService.findPartiesByCommunication(input.channel, input.value);
  }

  /** Creates the person plus their primary EMAIL and PHONE rows, in one transaction. */
  @Mutation(() => Person, { name: 'createPerson' })
  @RequirePermission(ORG_PEOPLE.add)
  async createPerson(@Args('input') input: CreatePersonInput): Promise<Person> {
    this.logger.log('MUTATION createPerson');
    const { data } = await this.peopleGatewayService.create({ ...input, isActive: true });
    return data;
  }

  /** Adds a communication — the `WEB_APP` reference in the signup flow. */
  @Mutation(() => PersonCommunication, { name: 'addPersonCommunication' })
  @RequirePermission(ORG_PEOPLE.communications.add)
  async addPersonCommunication(@Args('input') input: AddPersonCommunicationInput): Promise<PersonCommunication> {
    const { personId, ...communication } = input;
    this.logger.log(`MUTATION addPersonCommunication — channel: ${communication.channel}`);
    const { data } = await this.peopleGatewayService.createCommunication(personId, communication);
    return data;
  }
}
