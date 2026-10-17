import { Field, InputType } from '@nestjs/graphql';
import { IsCode } from '@vritti/api-sdk/decorators';
import { IsString, Length } from 'class-validator';

@InputType()
export class WishlistRefInput {
  @Field(() => String)
  @IsString()
  @Length(3, 3)
  currencyCode: string;

  // The product by its code, not the listing — the catalogue offer of it is resolved server-side, per site
  @Field(() => String)
  @IsCode()
  code: string;
}

@InputType()
export class WishlistQueryInput {
  @Field(() => String)
  @IsString()
  @Length(3, 3)
  currencyCode: string;
}
