import {
  PARTY_COMMUNICATION_CHANNELS,
  type PartyCommunicationChannelValue,
} from '@commerce/party-communications/dto/request/party-communication-app.dto';
import { Field, ID, InputType } from '@nestjs/graphql';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

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

@InputType()
export class AddPersonCommunicationInput {
  @Field(() => ID)
  @IsUUID('7')
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

@InputType()
export class UpdatePartyProfileInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  firstName?: string;

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
}
