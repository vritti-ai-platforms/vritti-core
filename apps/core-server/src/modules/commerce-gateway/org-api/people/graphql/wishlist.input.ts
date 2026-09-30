import { Field, ID, InputType } from '@nestjs/graphql';
import { IsString, IsUUID, Length } from 'class-validator';

@InputType()
export class WishlistRefInput {
  @Field(() => String)
  @IsString()
  @Length(3, 3)
  currencyCode: string;

  /** The product, not the listing — the catalogue offer of it is resolved server-side, per site. */
  @Field(() => ID)
  @IsUUID()
  offeringVariantId: string;
}

@InputType()
export class WishlistQueryInput {
  @Field(() => String)
  @IsString()
  @Length(3, 3)
  currencyCode: string;
}
