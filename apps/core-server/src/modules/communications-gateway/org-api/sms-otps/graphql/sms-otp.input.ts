import { Field, InputType } from '@nestjs/graphql';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

const E164 = /^\+[1-9]\d{7,14}$/;

@InputType()
export class SendSmsOtpInput {
  @Field(() => String)
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Matches(E164, { message: 'Enter a phone number in international format, e.g. +919876543210' })
  recipient: string;
}

@InputType()
export class VerifySmsOtpInput {
  @Field(() => String)
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Matches(E164, { message: 'Enter a phone number in international format, e.g. +919876543210' })
  recipient: string;

  @Field(() => String)
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  code: string;
}
