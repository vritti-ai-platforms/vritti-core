import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Mirror create-/update-uom-dimension.dto.ts so the resolver forwards an input straight to
// gateway.create/update. `code` is uppercase A-Z/0-9/_ starting with a letter (unique per BU).
@InputType()
export class CreateUomDimensionInput {
  @Field(() => String)
  @Trim({ nullify: false })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @IsCode()
  code: string;

  @Field(() => String)
  @Trim({ nullify: false })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @Field(() => String, { nullable: true })
  @Trim()
  @IsOptional()
  @IsString()
  description?: string | null;
}

// All fields optional for a partial update (PartialType from @nestjs/graphql keeps the @Field metadata).
@InputType()
export class UpdateUomDimensionInput extends PartialType(CreateUomDimensionInput) {}
