import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsString, IsUUID, Length, Max, Min } from 'class-validator';

@InputType()
export class CartScopeInput {
  @Field(() => String)
  @IsString()
  @Length(3, 3)
  currencyCode: string;
}

@InputType()
export class AddCartItemInput extends CartScopeInput {
  // The product, not the listing — the catalogue offer of it is resolved server-side, per site
  @Field(() => ID)
  @IsUUID('7')
  offeringVariantId: string;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

@InputType()
export class UpdateCartItemInput extends CartScopeInput {
  // The product, not the listing — the catalogue offer of it is resolved server-side, per site
  @Field(() => ID)
  @IsUUID('7')
  offeringVariantId: string;

  // An exact quantity, not a delta. Removing is its own mutation
  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

@InputType()
export class CartItemRefInput extends CartScopeInput {
  // The product, not the listing — the catalogue offer of it is resolved server-side, per site
  @Field(() => ID)
  @IsUUID('7')
  offeringVariantId: string;
}
