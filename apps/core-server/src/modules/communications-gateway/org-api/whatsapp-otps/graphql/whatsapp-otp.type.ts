import { Field, GraphQLISODateTime, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SendWhatsappOtpResult {
  @Field(() => Boolean)
  sent: boolean;

  @Field(() => GraphQLISODateTime)
  expiresAt: Date;

  @Field(() => GraphQLISODateTime)
  resendAvailableAt: Date;
}

@ObjectType()
export class VerifyWhatsappOtpResult {
  @Field(() => Boolean)
  verified: boolean;
}
