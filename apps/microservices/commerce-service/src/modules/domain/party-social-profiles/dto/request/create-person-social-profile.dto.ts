import { IsUUID } from 'class-validator';
import { SocialProfileInputDto } from './social-profile-input.dto';

export class CreatePersonSocialProfileDto extends SocialProfileInputDto {
  @IsUUID('7')
  personId: string;
}
