import { Field, GraphQLISODateTime, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SendWhatsappOtpResult {
  @Field(() => Boolean)
  sent: boolean;

  @Field(() => GraphQLISODateTime)
  expiresAt: string;

  @Field(() => GraphQLISODateTime)
  resendAvailableAt: string;
}

@ObjectType()
export class VerifyWhatsappOtpResult {
  @Field(() => Boolean)
  verified: boolean;
}
