import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, IsUUID, MinLength } from 'class-validator';

@InputType()
export class MobileLoginInput {
  @Field(() => String)
  @IsEmail()
  email: string;

  @Field(() => String)
  @IsString()
  @MinLength(8)
  password: string;

  @Field(() => ID)
  @IsUUID()
  organizationId: string;
}
