import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

// Mirror create-/update-uom-dimension.dto.ts so the resolver forwards an input straight to
// gateway.create/update. `code` is uppercase A-Z/0-9/_ starting with a letter (unique per BU).
@InputType()
export class CreateUomDimensionInput {
  @Field(() => String)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[A-Z][A-Z0-9_]*$/, { message: 'code must start with an uppercase letter (A-Z, 0-9, _)' })
  code: string;

  @Field(() => String)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}

// All fields optional for a partial update (PartialType from @nestjs/graphql keeps the @Field metadata).
@InputType()
export class UpdateUomDimensionInput extends PartialType(CreateUomDimensionInput) {}
