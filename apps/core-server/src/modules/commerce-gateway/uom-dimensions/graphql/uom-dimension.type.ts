import { Field, ID, ObjectType } from '@nestjs/graphql';

// Mirrors UomDimensionResponseDto — the UOM Dimension cards the mobile UOM screen lists. Date fields are
// String (ISO 8601): the gateway response carries ISO strings, not Date objects. canEdit/canDelete are
// only populated on detail/create/update responses (nullable on the list).
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
