import { Field, ID, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class CreateInventoryItemLocationInput {
  @Field(() => ID)
  @IsUUID('7')
  locationId: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}

@InputType()
export class UpdateInventoryItemLocationInput {
  @Field(() => Boolean)
  @IsBoolean()
  isBlocked: boolean;
}
