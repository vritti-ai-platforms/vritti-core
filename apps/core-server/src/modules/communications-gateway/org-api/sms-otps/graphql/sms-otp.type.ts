import { Field, GraphQLISODateTime, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SendSmsOtpResult {
  @Field(() => Boolean)
  sent: boolean;

  @Field(() => GraphQLISODateTime)
  expiresAt: Date;

  @Field(() => GraphQLISODateTime)
  resendAvailableAt: Date;
}

@ObjectType()
export class VerifySmsOtpResult {
  @Field(() => Boolean)
  verified: boolean;
}
