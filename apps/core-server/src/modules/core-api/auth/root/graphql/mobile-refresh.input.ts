import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class MobileRefreshInput {
  @Field(() => String)
  @IsString()
  refreshToken: string;
}
