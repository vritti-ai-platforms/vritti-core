import { Field, ID, ObjectType } from '@nestjs/graphql';

// Mirrors UomDimensionResponseDto — the UOM Dimension cards the mobile UOM screen lists.
@ObjectType()
export class UomDimension {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  code: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => Boolean, { nullable: true })
  canEdit?: boolean;

  @Field(() => Boolean, { nullable: true })
  canDelete?: boolean;

  @Field(() => String)
  createdAt: string;

  @Field(() => String)
  updatedAt: string;
}
