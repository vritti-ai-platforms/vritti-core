import {
  PARTY_COMMUNICATION_CHANNELS,
  type PartyCommunicationChannelValue,
} from '@commerce/party-communications/dto/request/party-communication-app.dto';
import { Field, ID, InputType } from '@nestjs/graphql';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * Creating a person party.
 *
 * Mirrors `CreatePersonDto` so the resolver forwards it straight through, minus the
 * fields an app caller has no business setting — the tax identifier and the
 * address, both of which belong to staff-curated data.
 *
 * `email` and `phone` become the party's **primary** EMAIL and PHONE
 * communications, created in the same transaction as the party itself.
 */
@InputType()
export class CreatePersonInput {
  @Field(() => String)
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  firstName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  lastName?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Trim()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(20)
  phone?: string | null;
}

/**
 * Adding a communication to an existing person.
 *
 * `isPrimary` is deliberately absent. An app adds a `WEB_APP` reference, which a
 * CHECK on the table forbids from being primary anyway, and re-pointing someone's
 * primary email is a staff decision rather than something a signup should do.
 */
@InputType()
export class AddPersonCommunicationInput {
  @Field(() => ID)
  @IsUUID()
  personId: string;

  @Field(() => String)
  @IsIn(Object.values(PARTY_COMMUNICATION_CHANNELS))
  channel: PartyCommunicationChannelValue;

  @Field(() => String)
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value: string;
}

/** Resolving who is reachable at a presented email or phone. */
@InputType()
export class FindPeopleByCommunicationInput {
  @Field(() => String)
  @IsIn(Object.values(PARTY_COMMUNICATION_CHANNELS))
  channel: PartyCommunicationChannelValue;

  @Field(() => String)
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value: string;
}
