import { Field, GraphQLISODateTime, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SendSmsOtpResult {
  @Field(() => Boolean)
  sent: boolean;

  @Field(() => GraphQLISODateTime)
  expiresAt: Date;

  @Field(() => GraphQLISODateTime)
  resendAvailableAt: Date;

  @Field(() => Int)
  codeLength: number;
}

@ObjectType()
export class VerifySmsOtpResult {
  @Field(() => Boolean)
  verified: boolean;
}
