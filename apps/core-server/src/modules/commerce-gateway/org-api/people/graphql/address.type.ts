import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

/**
 * One of the party's own addresses.
 *
 * A flattened view of what core holds. Core models an address with `functions` — REGISTERED,
 * BILLING, SHIPPING, ORDERING, each with its own primary flag — which is the vocabulary a business
 * needs and not one a party has. Until there is a checkout that distinguishes "bill to" from
 * "ship to", a storefront has one question to ask, so that whole structure reduces to `isDefault`.
 */
@ObjectType()
export class PartyAddress {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  line1: string;

  @Field(() => String, { nullable: true })
  line2: string | null;

  @Field(() => String, { nullable: true })
  city: string | null;

  @Field(() => String, { nullable: true })
  region: string | null;

  @Field(() => String, { nullable: true })
  postalCode: string | null;

  @Field(() => String)
  countryCode: string;

  /** Where orders go unless told otherwise — core's primary SHIPPING function, read as a flag. */
  @Field(() => Boolean)
  isDefault: boolean;
}

/**
 * An address as a party writes it.
 *
 * `id` is absent: adding is scoped to the party from the signature, and editing names the address
 * in its own input below.
 */
@InputType()
export class PartyAddressInput {
  @Field(() => String)
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  line1: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(255)
  line2?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  city?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  region?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(20)
  postalCode?: string | null;

  @Field(() => String)
  @IsString()
  @Length(2, 2)
  countryCode: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

/** Editing one — the same fields, plus which address. */
@InputType()
export class UpdatePartyAddressInput extends PartyAddressInput {
  @Field(() => ID)
  @IsUUID('7')
  id: string;
}

/** Removing one. */
@InputType()
export class PartyAddressRefInput {
  @Field(() => ID)
  @IsUUID('7')
  id: string;
}
